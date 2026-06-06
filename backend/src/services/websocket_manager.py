from dataclasses import dataclass
from typing import Optional
from urllib.parse import parse_qs

from fastapi import WebSocket, status

from src.services.auth_service import AuthService


@dataclass
class AuthedWebSocket:
    websocket: WebSocket
    user_id: Optional[str]  # None for anonymous (kicked below)
    is_authenticated: bool


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[AuthedWebSocket] = []

    async def connect(self, websocket: WebSocket) -> AuthedWebSocket:
        # Extract bearer token from `?token=` query string or `Authorization` header.
        token = None
        qs = parse_qs(websocket.url.query or "")
        if "token" in qs and qs["token"]:
            token = qs["token"][0]
        if not token:
            auth = websocket.headers.get("authorization", "")
            if auth.lower().startswith("bearer "):
                token = auth.split(" ", 1)[1].strip()
        if not token:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            raise RuntimeError("WebSocket rejected: missing token")

        user = await AuthService.verify_token(token)
        if user is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            raise RuntimeError("WebSocket rejected: invalid token")

        await websocket.accept()
        conn = AuthedWebSocket(
            websocket=websocket, user_id=str(user.id), is_authenticated=True
        )
        self.active_connections.append(conn)
        return conn

    def disconnect(self, websocket: WebSocket) -> None:
        for conn in list(self.active_connections):
            if conn.websocket is websocket:
                self.active_connections.remove(conn)
                return

    async def broadcast(self, message: dict) -> None:
        for conn in list(self.active_connections):
            try:
                await conn.websocket.send_json(message)
            except Exception:
                self.disconnect(conn.websocket)


manager = ConnectionManager()
