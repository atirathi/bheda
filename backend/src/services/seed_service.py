import hashlib
import os
import pathlib
import uuid

import yaml
from sqlalchemy import select, text

from src.database import async_session_factory
from src.models.challenge import Challenge
from src.models.category import Category


_DIR_CATEGORY_MAP: dict[str, str] = {
    "sqli": "SQL Injection",
    "xss": "Cross-Site Scripting",
    "access-control": "Access Control",
    "auth": "Access Control",
    "api": "Access Control",
    "ssrf": "SSRF",
    "jwt": "JWT",
    "ssti": "SSTI",
    "xxe": "XXE",
    "deser": "Deserialization",
    "race": "Race Condition",
    "biz": "Business Logic",
    "crypto": "Crypto",
    "infra": "Infrastructure",
    "logging": "Infrastructure",
    "waf": "WAF Bypass",
    "wasm": "WASM",
    "ws": "WebSocket",
    "tls": "TLS",
    "zero-day": "Zero Day",
    "rabbit-holes": "Rabbit Holes",
    "boss": "Boss",
    "supply-chain": "Supply Chain",
    "other": "Other Notable",
}


def _generate_deterministic_uuid(namespace: str, name: str) -> uuid.UUID:
    return uuid.uuid5(uuid.NAMESPACE_DNS, f"bheda/{namespace}/{name}")


# Defaults to the in-container mount; overridable via CHALLENGES_DIR so the
# seeder can run against a checkout (e.g. in tests) without the Docker path.
_CHALLENGES_DIR = pathlib.Path(os.environ.get("CHALLENGES_DIR", "/app/challenges"))
_CATEGORY_DEFAULTS: dict[str, tuple[str, str, int]] = {
    "Boss": ("skull", "#8B0000", 0),
    "TLS": ("lock", "#A9CCE3", 18),
    "Zero Day": ("alert-circle", "#F1948A", 19),
    "Rabbit Holes": ("compass", "#D7BDE2", 20),
}


async def _ensure_category(session, name: str) -> Category | None:
    result = await session.execute(select(Category).where(Category.name == name))
    cat = result.scalar_one_or_none()
    if cat is not None:
        return cat
    icon, color, sort = _CATEGORY_DEFAULTS.get(name, ("help-circle", "#999999", 99))
    cat = Category(name=name, icon=icon, color=color, sort_order=sort)
    session.add(cat)
    await session.flush()
    return cat


async def seed_challenges() -> int:
    if not _CHALLENGES_DIR.is_dir():
        return 0

    yaml_files = sorted(_CHALLENGES_DIR.rglob("*.yaml"))
    if not yaml_files:
        return 0

    async with async_session_factory() as session:
        existing_count = await session.scalar(select(text("count(*)")).select_from(Challenge.__table__))
        if existing_count and existing_count > 0:
            return 0

        seeded = 0
        skipped_no_category = 0

        for path in yaml_files:
            try:
                raw = path.read_text()
                data = yaml.safe_load(raw)
                if not data or not isinstance(data, dict):
                    continue
            except Exception:
                continue

            title = data.get("title") or path.stem
            difficulty = str(data.get("difficulty", "medium")).lower()
            flag = data.get("flag", "")
            flag_hash = hashlib.sha256(flag.encode()).hexdigest()
            cvss = data.get("cvss")
            owasp = data.get("owasp")
            endpoint = data.get("endpoint", "")
            description = data.get("description", "")
            hints = data.get("hints") or []
            solution = data.get("solution_summary", "")
            challenge_id_str = data.get("id", path.stem)

            dir_name = path.parent.name
            cat_name = _DIR_CATEGORY_MAP.get(dir_name)
            if cat_name is None:
                skipped_no_category += 1
                continue

            category = await _ensure_category(session, cat_name)
            if category is None:
                skipped_no_category += 1
                continue

            cid = _generate_deterministic_uuid("challenge", challenge_id_str)
            existing = await session.get(Challenge, cid)
            if existing is not None:
                continue

            challenge = Challenge(
                id=cid,
                category_id=category.id,
                title=title,
                description=description,
                difficulty=difficulty,
                cvss_score=cvss,
                owasp_mapping=owasp,
                endpoint=endpoint,
                flag_hash=flag_hash,
                points=_compute_points(difficulty, cvss),
                metadata_={
                    "hints": hints,
                    "solution_summary": solution,
                    "source_yaml": challenge_id_str,
                },
            )
            session.add(challenge)
            seeded += 1

        try:
            await session.commit()
        except Exception:
            await session.rollback()
            return 0

    return seeded


def _compute_points(difficulty: str, cvss: float | None) -> int:
    base = {"beginner": 50, "easy": 100, "medium": 200, "hard": 350, "insane": 500, "expert": 500}
    pts = base.get(difficulty, 100)
    if cvss is not None:
        pts = int(pts * (1 + cvss / 10))
    return pts
