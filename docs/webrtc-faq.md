# WebRTC Troubleshooting FAQ

## Why can't I connect between two different networks?

This usually happens because NATs or firewalls block direct peer-to-peer communication.

### Possible Fixes

- Use a STUN server
- Configure a TURN server
- Check firewall restrictions
- Try another network connection

---

## How do I configure a TURN server?

TURN servers relay traffic when direct peer connections fail.

Example:

```javascript
const pc = new RTCPeerConnection({
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
    {
      urls: "turn:your-turn-server.com",
      username: "user",
      credential: "password",
    },
  ],
});
```

---

## Why does my connection drop after a few minutes?

Common causes include:

- unstable internet connection
- ICE timeout
- TURN server disconnect
- firewall restrictions

### Troubleshooting Steps

- Enable ICE restart
- Check network stability
- Verify TURN credentials
- Review browser logs

---

## How do I debug signaling errors?

Check:

- SDP offer/answer exchange
- ICE candidate transfer
- signaling server logs

Useful tools:

- chrome://webrtc-internals
- browser developer console
