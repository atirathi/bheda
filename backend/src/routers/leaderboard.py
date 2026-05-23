import uuid

from fastapi import APIRouter, Depends, HTTPException, status

from src.middleware.auth_middleware import get_current_user
from src.models.user import User
from src.services.scoring_service import ScoringService

router = APIRouter(prefix="/api/v1/leaderboard", tags=["leaderboard"])


@router.get("/")
async def get_leaderboard(current_user: User = Depends(get_current_user)):
    cached = await ScoringService.get_cached_leaderboard()
    if cached:
        return cached
    leaderboard = await ScoringService.recalculate_leaderboard()
    return leaderboard


@router.get("/team/{team_id}")
async def get_team_leaderboard(
    team_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
):
    leaderboard = await ScoringService.recalculate_leaderboard()
    for entry in leaderboard:
        if entry["team_id"] == str(team_id):
            return entry
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found on leaderboard")
