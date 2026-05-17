---
"zerithdb-core": minor
"zerithdb-network": minor
"zerithdb-sync": minor
"zerithdb-sdk": minor
---

Add P2P video conferencing orchestration with low-latency ephemeral metadata sync.

- Add typed media stream metadata, active speaker, and video participant state types.
- Add `SyncEngine.ephemeral` for non-persistent peer metadata such as mute state and active speaker.
- Add MediaStream publishing, metadata updates, and remote stream events to `NetworkManager`.
- Add `app.video` as an SDK facade for mesh call stream publishing and participant metadata sync.
