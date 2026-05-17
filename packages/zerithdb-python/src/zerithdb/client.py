import sentry_sdk
import logging
import uuid
from typing import Callable, Dict, Any, Awaitable

from .network import NetworkManager

logger = logging.getLogger(__name__)

class ZerithClient:
    """
    A Python client for ZerithDB that joins a WebRTC P2P mesh network.
    """
    def __init__(self, signaling_url: str = "wss://arpitkhandelwal810-zerith-signaling.hf.space", sentry_dsn: str = None):
        self.signaling_url = signaling_url
        self.peer_id = str(uuid.uuid4())
        self.network = NetworkManager(self.signaling_url, self.peer_id)
        self.handlers: Dict[str, Callable[[Any], Awaitable[None]]] = {}
        self.db_state: Dict[str, Dict[str, Any]] = {}
        
        # Setup network callbacks
        self.network.on_message = self._handle_network_message
        if sentry_dsn:
           sentry_sdk.init(dsn=sentry_dsn, traces_sample_rate=1.0)
           logger.info("Sentry crash reporting enabled.")

    async def connect(self, room_id: str):
        """Connect to the signaling server and join the room."""
        await self.network.connect(room_id)
        logger.info(f"Connected to room {room_id} as peer {self.peer_id}")

    def on(self, event_name: str):
        """Decorator to register an event handler."""
        def decorator(func: Callable[[Any], Awaitable[None]]):
            self.handlers[event_name] = func
            return func
        return decorator

    async def _handle_network_message(self, message: dict, from_peer: str):
        """Handle incoming P2P messages from other peers."""
        msg_type = message.get("type")
        payload = message.get("payload")
        
        if msg_type == "sync:update":
            table = payload.get("table")
            record = payload.get("record")
            
            if table not in self.db_state:
                self.db_state[table] = {}
            
            self.db_state[table][record["id"]] = record
            
            # Emit event
            event_name = f"{table}:updated" if record.get("_rev") else f"{table}:inserted"
            if event_name in self.handlers:
                await self.handlers[event_name](record)

    async def insert(self, table: str, data: dict):
        """Insert a new record and broadcast it to the mesh."""
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
            
        if table not in self.db_state:
            self.db_state[table] = {}
            
        self.db_state[table][data["id"]] = data
        
        msg = {
            "type": "sync:update",
            "payload": {
                "table": table,
                "record": data
            }
        }
        await self.network.broadcast(msg)

    async def update(self, table: str, record_id: str, data: dict):
        """Update an existing record and broadcast."""
        if table not in self.db_state or record_id not in self.db_state[table]:
            raise ValueError(f"Record {record_id} not found in table {table}")
            
        record = self.db_state[table][record_id]
        record.update(data)
        record["_rev"] = record.get("_rev", 0) + 1
        
        msg = {
            "type": "sync:update",
            "payload": {
                "table": table,
                "record": record
            }
        }
        await self.network.broadcast(msg)

    async def wait_until_disconnected(self):
        """Keep the client running until explicitly disconnected."""
        await self.network.wait_until_disconnected()
