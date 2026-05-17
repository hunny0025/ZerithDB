import asyncio
import json
import logging
from typing import Any, Dict, Optional, Callable, Awaitable

import sentry_sdk
import websockets
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCDataChannel

logger = logging.getLogger(__name__)

class NetworkManager:
    """Manages WebRTC peer-to-peer connections via a signaling server."""
    def __init__(self, signaling_url: str, local_peer_id: str):
        self.signaling_url = signaling_url
        self.local_peer_id = local_peer_id
        self.ws: Optional[Any] = None
        self.peers: Dict[str, RTCPeerConnection] = {}
        self.channels: Dict[str, RTCDataChannel] = {}
        self.on_message: Optional[Callable[[dict, str], Awaitable[None]]] = None
        self._disconnect_event = asyncio.Event()

    async def connect(self, room_id: str):
        url = f"{self.signaling_url}?room={room_id}&peer={self.local_peer_id}"
        self.ws = await websockets.connect(url)
        asyncio.create_task(self._listen_signaling())

    async def _listen_signaling(self):
        try:
            async for message in self.ws:
                msg = json.loads(message)
                await self._handle_signaling_message(msg)
        except websockets.ConnectionClosed:
            logger.info("Signaling server disconnected.")
            self._disconnect_event.set()
        except Exception as e:
            logger.error(f"Signaling error: {e}")
            sentry_sdk.capture_exception(e)
            self._disconnect_event.set()

    async def _handle_signaling_message(self, msg: dict):
        msg_type = msg.get("type")
        
        if msg_type == "peer-list":
            for remote_peer_id in msg.get("payload", []):
                if remote_peer_id != self.local_peer_id:
                    await self._create_peer(remote_peer_id, initiator=True)
                    
        elif msg_type == "offer":
            if msg.get("to") == self.local_peer_id:
                remote_peer_id = msg.get("from")
                offer = msg.get("payload")
                await self._create_peer(remote_peer_id, initiator=False, offer_payload=offer)
                
        elif msg_type == "answer":
            remote_peer_id = msg.get("from")
            answer = msg.get("payload")
            pc = self.peers.get(remote_peer_id)
            if pc:
                await pc.setRemoteDescription(
                    RTCSessionDescription(sdp=answer["sdp"], type=answer["type"])
                )
                
        elif msg_type == "ice-candidate":
            remote_peer_id = msg.get("from")
            pc = self.peers.get(remote_peer_id)
            if pc:
                pass

    async def _create_peer(self, remote_peer_id: str, initiator: bool, offer_payload: dict = None):
        if remote_peer_id in self.peers:
            return

        pc = RTCPeerConnection()
        self.peers[remote_peer_id] = pc

        @pc.on("datachannel")
        def on_datachannel(channel):
            self._setup_data_channel(remote_peer_id, channel)

        if initiator:
            channel = pc.createDataChannel("zerithdb-sync")
            self._setup_data_channel(remote_peer_id, channel)
            
            offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            
            await self._send_signaling({
                "type": "offer",
                "from": self.local_peer_id,
                "to": remote_peer_id,
                "payload": {
                    "sdp": pc.localDescription.sdp,
                    "type": pc.localDescription.type
                }
            })
        else:
            if offer_payload:
                await pc.setRemoteDescription(
                    RTCSessionDescription(sdp=offer_payload["sdp"], type=offer_payload["type"])
                )
                answer = await pc.createAnswer()
                await pc.setLocalDescription(answer)
                
                await self._send_signaling({
                    "type": "answer",
                    "from": self.local_peer_id,
                    "to": remote_peer_id,
                    "payload": {
                        "sdp": pc.localDescription.sdp,
                        "type": pc.localDescription.type
                    }
                })

    def _setup_data_channel(self, remote_peer_id: str, channel: RTCDataChannel):
        self.channels[remote_peer_id] = channel
        
        @channel.on("message")
        def on_message(message):
            if self.on_message:
                try:
                    data = json.loads(message)
                    asyncio.create_task(self.on_message(data, remote_peer_id))
                except Exception as e:
                    logger.error(f"Failed to parse P2P message: {e}")
                    sentry_sdk.capture_exception(e)

    async def _send_signaling(self, data: dict):
        if self.ws and not self.ws.closed:
            await self.ws.send(json.dumps(data))

    async def broadcast(self, message: dict):
        """Send a message to all connected peers over WebRTC datachannels."""
        data = json.dumps(message)
        for channel in self.channels.values():
            if channel.readyState == "open":
                channel.send(data)

    async def wait_until_disconnected(self):
        await self._disconnect_event.wait()