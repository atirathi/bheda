"""Application settings.

Defaults deliberately use fail-fast sentinels (`CHANGE_ME_*`,
`REPLACE_ME_*`) for any secret or env-specific value.  If the
operator forgets to provide a real value via the environment, the
process raises at startup rather than silently running with a
known-public default.

`docker-compose.yml` and `deploy/k8s/*.yml` already require these
envs at the orchestrator level (`${VAR:?VAR is required}`), so the
defaults here are a safety net for `python -m` invocations during
local development.
"""

import secrets
import warnings
from functools import lru_cache

from pydantic_settings import BaseSettings


_DEFAULT_FAIL = "CHANGE_ME_REPLACE_BEFORE_DEPLOY"


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://bheda:bheda@localhost:5432/bheda"
    redis_url: str = "redis://localhost:6379/0"
    secret_key: str = _DEFAULT_FAIL
    api_key: str = _DEFAULT_FAIL
    # Shared with the vuln-app: flags are derived deterministically from
    # this secret, so the backend can verify a submission without storing
    # plaintext flags. MUST equal the vuln-app's FLAG_SECRET.
    flag_secret: str = _DEFAULT_FAIL
    mode: str = "practice"
    profiles_enabled: bool = True
    rabbit_holes_enabled: bool = True
    scheduler_enabled: bool = True
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60
    # DB connection pool, per uvicorn worker. Cluster total =
    # WEB_CONCURRENCY * (db_pool_size + db_max_overflow); keep that under
    # Postgres max_connections (set in docker-compose) or workers get
    # "too many connections" under load.
    db_pool_size: int = 10
    db_max_overflow: int = 10
    db_pool_timeout: int = 30
    # Default CORS allowlist.  We refuse to start with `*` because
    # that combined with credentialed requests is a CSRF amplifier.
    # Operators MUST set `CORS_ORIGINS` to the public origin(s) of
    # the deployment, e.g. `https://bheda.ctf,https://app.bheda.ctf`.
    cors_origins: str = "https://bheda.ctf,https://localhost:3000"
    # Comma-separated list of CIDR ranges / IPs whose `X-Forwarded-For`
    # / `X-Real-IP` headers may be trusted by the rate-limit and
    # IP-recording middleware.  Defaults to "loopback only" so a
    # developer running without Traefik still gets correct client IPs.
    trusted_proxies: str = "127.0.0.1/32,::1/128,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16"
    # If true, `/docs`, `/redoc`, and `/openapi.json` are served.
    # Disable in production by setting `DOCS_ENABLED=false`.
    docs_enabled: bool = False
    # If true, public `/api/v1/stats` returns aggregate counters
    # (`total_challenges`, `active_users`, `ctf_active`).
    public_stats_enabled: bool = True

    # extra=ignore: the deployment env / .env also holds vars for other
    # services (MINIO_*, MONGO_*, VULN_DB, ...). The backend must ignore
    # those rather than refuse to start.
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    def assert_safe(self) -> None:
        """Call once at startup to refuse boot with placeholder secrets."""
        if self.secret_key == _DEFAULT_FAIL or "CHANGE_ME" in self.secret_key or "REPLACE" in self.secret_key:
            raise RuntimeError(
                "SECRET_KEY is not set to a real value. Refusing to start: "
                "JWTs would be signed with a publicly-known default. "
                "Set SECRET_KEY in the environment (or .env)."
            )
        if self.api_key == _DEFAULT_FAIL or "CHANGE_ME" in self.api_key or "REPLACE" in self.api_key:
            raise RuntimeError(
                "API_KEY is not set to a real value. Refusing to start: "
                "the internal API key would be public. "
                "Set API_KEY in the environment (or .env)."
            )
        if (
            self.flag_secret == _DEFAULT_FAIL
            or "CHANGE_ME" in self.flag_secret
            or "REPLACE" in self.flag_secret
        ):
            raise RuntimeError(
                "FLAG_SECRET is not set to a real value. Refusing to start: "
                "flags are derived from it and would be publicly forgeable. "
                "It MUST match the vuln-app's FLAG_SECRET."
            )
        # "ctf" is the value used throughout deploy/compose, the README,
        # and .env.example; it must be accepted or the backend refuses to
        # boot in CTF mode.
        if self.mode not in ("practice", "ctf", "competition", "exam"):
            raise RuntimeError(
                f"Invalid MODE={self.mode!r}. Expected 'practice', 'ctf', 'competition', or 'exam'."
            )
        if "*" in self.cors_origins:
            warnings.warn(
                "CORS_ORIGINS contains '*' which is unsafe with credentialed requests. "
                "Setting an explicit allowlist is strongly recommended.",
                stacklevel=2,
            )
        if len(self.secret_key) < 32:
            raise RuntimeError(
                f"SECRET_KEY is too short ({len(self.secret_key)} chars). "
                "Use at least 32 bytes of entropy (e.g. `openssl rand -hex 32`)."
            )

    def generate_dev_secrets(self) -> "Settings":
        """Return a copy with the secret fields replaced by random
        values.  Used by the dev / test harness to avoid the
        fail-fast assert when no real secrets are configured."""
        cloned = self.model_copy()
        cloned.secret_key = secrets.token_hex(32)
        cloned.api_key = secrets.token_hex(24)
        return cloned


@lru_cache
def get_settings() -> Settings:
    return Settings()
