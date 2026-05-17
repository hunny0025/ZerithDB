---
"zerithdb-sdk": patch
---

Add validation for `appId` in `createApp()`. Throws `SDK_INVALID_CONFIG` error if `appId` is empty
or missing.
