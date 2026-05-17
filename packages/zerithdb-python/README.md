# ZerithDB Python SDK (AI Agent Node)

The Python SDK for ZerithDB allows headless Python scripts to join the WebRTC mesh network just like
a normal user!

Since ZerithDB syncs via a P2P mesh, you don't need a REST API to interact with the database. You
can build a `zerithdb-python` package that runs heavy machine learning workloads (e.g., PyTorch,
Transformers) on a GPU server, syncing data seamlessly.

## How it works

1. A browser user inserts a row into the database:

   ```javascript
   app.db("jobs").insert({ text: "Translate this", status: "pending" });
   ```

2. The Python script (running on a server) connects to the same WebRTC room and syncs this data via
   P2P.

3. The script processes the text and updates the row:
   ```python
   async def on_job_added(job):
       result = my_ml_model.process(job["text"])
       await db.table("jobs").update(job["id"], { "status": "done", "result": result })
   ```

## Why it's cool

Developers can add heavy ML processing to their apps without building APIs, webhooks, or queues. The
Python script is just another "peer" in the room!

## Getting Started

```bash
pip install zerithdb-python
```

### Basic Example

```python
import asyncio
from zerithdb import ZerithClient

async def main():
    # Initialize the client and connect to a room
    client = ZerithClient("wss://zerith-signaling-523861363926.asia-south1.run.app")
    await client.connect("my-app-room-id")

    # Listen for new data
    @client.on("jobs:inserted")
    async def handle_job(job):
        if job["status"] == "pending":
            print(f"Processing job: {job['text']}")
            # Run your ML model here...
            await client.update("jobs", job["id"], {"status": "done", "result": "Translated text!"})

    # Keep the agent running
    await client.wait_until_disconnected()

if __name__ == "__main__":
    asyncio.run(main())
```

## Architecture

- Uses `aiortc` for WebRTC connections and data channels.
- Uses `websockets` for the initial signaling phase.
- Communicates using the standard ZerithDB CRDT sync protocol.

## Troubleshooting

Having trouble installing? Common issues (like `Failed to build aiortc` due to missing `ffmpeg`) are
documented in the **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** guide, with step-by-step fixes for
Windows, macOS and Linux.
