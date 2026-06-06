import json

import yaml
from sqlalchemy import select

from src.database import async_session_factory
from src.models.challenge import Challenge
from src.models.category import Category
from src.models.profile import Profile


class ProfileService:

    @staticmethod
    async def create_profile(name: str, description: str | None = None, config: dict | None = None) -> Profile:
        async with async_session_factory() as session:
            existing = await session.execute(
                select(Profile).where(Profile.name == name)
            )
            if existing.scalar_one_or_none():
                raise ValueError("Profile name already exists")
            profile = Profile(name=name, description=description, config=config or {})
            session.add(profile)
            await session.commit()
            await session.refresh(profile)
            return profile

    @staticmethod
    async def get_current_profile() -> Profile | None:
        async with async_session_factory() as session:
            result = await session.execute(
                select(Profile).where(Profile.is_default.is_(True))
            )
            return result.scalar_one_or_none()

    @staticmethod
    async def apply_profile(profile_id: str) -> int:
        async with async_session_factory() as session:
            result = await session.execute(
                select(Profile).where(Profile.id == profile_id)
            )
            profile = result.scalar_one_or_none()
            if profile is None:
                raise ValueError("Profile not found")

            config = profile.config
            updated_count = 0

            # Strict allowlist of mutable columns for each entity. Anything
            # else in the profile YAML is ignored — including `flag_hash`,
            # `points`, `id`, `category_id`, and any relationship attributes.
            CHALLENGE_MUTABLE = frozenset({
                "title",
                "description",
                "difficulty",
                "cvss_score",
                "owasp_mapping",
                "real_cve",
                "endpoint",
                "enabled",
                "waf_enabled",
                "hint_enabled",
                "start_at",
                "end_at",
                "max_attempts",
                "requires",
                "metadata_",
            })
            CATEGORY_MUTABLE = frozenset({
                "name",
                "icon",
                "color",
                "sort_order",
                "enabled",
                "description",
            })

            if "challenges" in config:
                for chal_config in config["challenges"]:
                    chal_result = await session.execute(
                        select(Challenge).where(Challenge.id == chal_config.get("id"))
                    )
                    challenge = chal_result.scalar_one_or_none()
                    if challenge:
                        for key, value in chal_config.items():
                            if key in CHALLENGE_MUTABLE:
                                setattr(challenge, key, value)
                        updated_count += 1

            if "categories" in config:
                for cat_config in config["categories"]:
                    cat_result = await session.execute(
                        select(Category).where(Category.id == cat_config.get("id"))
                    )
                    category = cat_result.scalar_one_or_none()
                    if category:
                        for key, value in cat_config.items():
                            if key in CATEGORY_MUTABLE:
                                setattr(category, key, value)

            await session.commit()
            return updated_count

    @staticmethod
    async def export_profile(profile_id: str) -> str:
        async with async_session_factory() as session:
            result = await session.execute(
                select(Profile).where(Profile.id == profile_id)
            )
            profile = result.scalar_one_or_none()
            if profile is None:
                raise ValueError("Profile not found")
            return yaml.dump(profile.config, default_flow_style=False)

    @staticmethod
    async def import_profile(name: str, yaml_content: str) -> Profile:
        config = yaml.safe_load(yaml_content)
        return await ProfileService.create_profile(name, config=config)
