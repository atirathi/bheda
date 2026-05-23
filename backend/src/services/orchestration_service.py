import docker
from docker.errors import DockerException, NotFound

from src.config import get_settings

settings = get_settings()


class OrchestrationService:
    _client: docker.DockerClient | None = None

    @classmethod
    def _get_client(cls) -> docker.DockerClient:
        if cls._client is None:
            cls._client = docker.from_env()
        return cls._client

    @classmethod
    async def spawn_instance(cls, challenge_id: str, team_id: str) -> str:
        client = cls._get_client()
        container_name = f"bheda-{challenge_id[:8]}-{team_id[:8]}"
        try:
            container = client.containers.run(
                "bheda-challenge-base",
                name=container_name,
                detach=True,
                environment={
                    "CHALLENGE_ID": challenge_id,
                    "TEAM_ID": team_id,
                    "MODE": settings.mode,
                },
                network="bheda_net",
                mem_limit="256m",
                cpu_period=100000,
                cpu_quota=50000,
            )
            return container.id
        except DockerException as e:
            raise RuntimeError(f"Failed to spawn instance: {e}")

    @classmethod
    async def teardown_instance(cls, instance_id: str) -> bool:
        client = cls._get_client()
        try:
            container = client.containers.get(instance_id)
            container.stop(timeout=10)
            container.remove(force=True)
            return True
        except NotFound:
            return False
        except DockerException as e:
            raise RuntimeError(f"Failed to teardown instance: {e}")

    @classmethod
    async def get_instance_status(cls, instance_id: str) -> str:
        client = cls._get_client()
        try:
            container = client.containers.get(instance_id)
            return container.status
        except NotFound:
            return "not_found"
        except DockerException:
            return "unknown"

    @classmethod
    async def teardown_all(cls, challenge_id: str | None = None) -> int:
        client = cls._get_client()
        count = 0
        try:
            filters = {"name": "bheda-"}
            if challenge_id:
                filters = {"name": f"bheda-{challenge_id[:8]}"}
            containers = client.containers.list(filters=filters, all=True)
            for container in containers:
                try:
                    container.stop(timeout=10)
                    container.remove(force=True)
                    count += 1
                except DockerException:
                    pass
        except DockerException:
            pass
        return count

    @classmethod
    async def cleanup_expired(cls) -> int:
        return await cls.teardown_all()
