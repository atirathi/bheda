from src.routers.auth import router as auth_router
from src.routers.categories import router as categories_router
from src.routers.challenges import router as challenges_router
from src.routers.ctf_compat import router as ctf_compat_router
from src.routers.events import router as events_router
from src.routers.internal import router as internal_router
from src.routers.leaderboard import router as leaderboard_router
from src.routers.monitor import router as monitor_router
from src.routers.profiles import router as profiles_router
from src.routers.rabbit_holes import router as rabbit_holes_router
from src.routers.schedule import router as schedule_router
from src.routers.stats import router as stats_router
from src.routers.submissions import router as submissions_router
from src.routers.teams import router as teams_router
from src.routers.users import router as users_router

__all__ = [
    "auth_router",
    "categories_router",
    "challenges_router",
    "ctf_compat_router",
    "events_router",
    "internal_router",
    "leaderboard_router",
    "monitor_router",
    "profiles_router",
    "rabbit_holes_router",
    "schedule_router",
    "stats_router",
    "submissions_router",
    "teams_router",
    "users_router",
]
