from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from src.config import get_settings
from src.services.schedule_service import ScheduleService

scheduler = AsyncIOScheduler()
settings = get_settings()


async def check_schedules():
    if not settings.scheduler_enabled:
        return
    try:
        actions = await ScheduleService.check_and_execute()
        if actions:
            for action in actions:
                print(f"[Scheduler] {action['type']}: {action.get('title', action.get('id', 'unknown'))}")
    except Exception as e:
        print(f"[Scheduler] Error: {e}")


def start_scheduler():
    scheduler.add_job(
        check_schedules,
        IntervalTrigger(seconds=60),
        id="check_schedules",
        replace_existing=True,
    )
    scheduler.start()
    print("[Scheduler] Started")


def stop_scheduler():
    scheduler.shutdown(wait=False)
    print("[Scheduler] Stopped")
