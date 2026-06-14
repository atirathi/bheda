"""Deterministic flag generation.

MUST stay byte-for-byte compatible with vuln-app/src/utils/flag.ts:
the vuln-app embeds these flags in challenge data, and the backend hashes
the same value to verify submissions. If the two diverge, no flag a
player extracts will ever validate.

    flag = BHEDA{<challenge_id>_<first 16 hex of sha256(
        "<challenge_id>:<user_id|anonymous>:<FLAG_SECRET>")>}
"""

import hashlib

from src.config import get_settings


def generate_flag(challenge_id: str, user_id: str | None = None) -> str:
    secret = get_settings().flag_secret
    data = f"{challenge_id}:{user_id or 'anonymous'}:{secret}"
    digest = hashlib.sha256(data.encode()).hexdigest()[:16]
    return f"BHEDA{{{challenge_id}_{digest}}}"
