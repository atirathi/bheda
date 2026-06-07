"""Shared submission service used by both `/submissions/` and the
`/challenges/submit` alias.  Putting the logic in one place ensures
the brute-force cap, chain dependency check, and team membership
check can't drift between the two routes.

This used to live inline in `routers/submissions.py` and was
duplicated (partially) in `routers/challenges.py` — that duplication
caused the alias to skip the `requires` check, letting players skip
chain challenges by submitting through `/challenges/submit`.
"""

import uuid

from fastapi import HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from src.database import async_session_factory
from src.models.challenge import Challenge
from src.models.event import CTFEvent
from src.models.submission import Submission
from src.models.team import Team, TeamMember
from src.models.user import User
from src.services.challenge_service import ChallengeService
from src.services.scoring_service import ScoringService
from src.services.websocket_manager import manager


class SubmissionService:
    @staticmethod
    async def submit(
        *,
        current_user: User,
        challenge_id: uuid.UUID,
        flag: str,
        team_id: uuid.UUID | None,
        request: Request,
    ) -> dict:
        async with async_session_factory() as session:
            chal = (
                await session.execute(
                    select(Challenge)
                    .options(selectinload(Challenge.category))
                    .where(Challenge.id == challenge_id)
                )
            ).scalar_one_or_none()
            if chal is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Challenge not found",
                )
            if not chal.enabled or not chal.category.enabled:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Challenge not found or disabled",
                )

            # Team membership check (only required when team_id is set).
            if team_id:
                team = (
                    await session.execute(select(Team).where(Team.id == team_id))
                ).scalar_one_or_none()
                if team is None:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND, detail="Team not found"
                    )
                membership = (
                    await session.execute(
                        select(TeamMember).where(
                            TeamMember.team_id == team_id,
                            TeamMember.user_id == current_user.id,
                        )
                    )
                ).scalar_one_or_none()
                if membership is None:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You are not a member of this team",
                    )

            # CTF-mode enforcement: if a CTF event is active, every
            # submission must be under a team.
            active_event = (
                await session.execute(
                    select(CTFEvent).where(CTFEvent.status == "active")
                )
            ).scalar_one_or_none()
            if active_event and not team_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A CTF event is active. Submissions must be made under a team.",
                )

            # Brute-force cap.  Applied to BOTH solo and team submissions.
            # The previous version only applied the cap to team submissions,
            # letting a solo player brute-force a challenge with
            # `max_attempts > 0` unlimited times.
            if chal.max_attempts > 0:
                cap_query = select(func.count(Submission.id)).where(
                    Submission.challenge_id == chal.id,
                )
                if team_id:
                    cap_query = cap_query.where(Submission.team_id == team_id)
                else:
                    cap_query = cap_query.where(Submission.user_id == current_user.id)
                attempts = (await session.execute(cap_query)).scalar() or 0
                if attempts >= chal.max_attempts:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Maximum attempts exceeded for this challenge",
                    )

            # Chain dependencies.  Applies to BOTH routes.
            if chal.requires:
                for req_id in chal.requires:
                    dep_query = select(Submission).where(
                        Submission.challenge_id == req_id,
                        Submission.correct.is_(True),
                    )
                    if team_id:
                        dep_query = dep_query.where(Submission.team_id == team_id)
                    else:
                        dep_query = dep_query.where(Submission.user_id == current_user.id)
                    solved = (await session.execute(dep_query)).scalar_one_or_none()
                    if solved is None:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Prerequisite challenge not solved: {req_id}",
                        )

            flag_hash = await ChallengeService.hash_flag(flag)
            correct = await ChallengeService.verify_flag(flag, chal.flag_hash)

            submission = Submission(
                user_id=current_user.id,
                team_id=team_id,
                challenge_id=chal.id,
                flag_hash=flag_hash,
                correct=correct,
                ip_address=SubmissionService._client_ip(request),
                user_agent=(request.headers.get("user-agent") or "")[:512],
            )
            session.add(submission)
            await session.commit()
            await session.refresh(submission)

            if correct and active_event:
                leaderboard = await ScoringService.recalculate_leaderboard(
                    str(active_event.id)
                )
                await manager.broadcast(
                    {"type": "leaderboard_update", "data": leaderboard}
                )

            return {
                "submission_id": str(submission.id),
                "status": "correct" if correct else "accepted",
                "correct": correct,
            }

    @staticmethod
    def _client_ip(request: Request) -> str | None:
        """Use the trust-aware IP extraction from the rate-limit
        middleware.  If a trusted proxy is in front, X-Forwarded-For
        is honored; otherwise we fall back to the direct peer.
        `request.client.host` alone collapses every request behind
        Traefik into a single IP.
        """
        from src.middleware.rate_limit_middleware import _extract_client_ip
        return _extract_client_ip(request)
