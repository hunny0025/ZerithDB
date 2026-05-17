# zerithdb-network

## [0.1.0](https://github.com/hunny0025/ZerithDB/compare/zerithdb-network-v0.0.1...zerithdb-network-v0.1.0) (2026-05-17)


### Features

* add polling transport fallback ([8c9ad5d](https://github.com/hunny0025/ZerithDB/commit/8c9ad5d38ecd873bd9878ebcb3d4056dbccdf0df))
* **cli:** add global experimental flag for beta features ([#625](https://github.com/hunny0025/ZerithDB/issues/625)) ([c219504](https://github.com/hunny0025/ZerithDB/commit/c219504b9796cecfb0febaa88add5f0a6c60aefe))
* **devtools:** memory usage visualizer for IndexedDB and WebRTC ([#511](https://github.com/hunny0025/ZerithDB/issues/511)) ([febd74e](https://github.com/hunny0025/ZerithDB/commit/febd74e395ee2e598a063d9dbad0f779e4a2c3fe))
* **examples:** add visual offline indicator to Playground ([#32](https://github.com/hunny0025/ZerithDB/issues/32)) ([f1b26bd](https://github.com/hunny0025/ZerithDB/commit/f1b26bd7c410ff47bd71ec39afa0f9f4312f3dc8))
* improve framework icon styles and add floating animations ([#562](https://github.com/hunny0025/ZerithDB/issues/562)) ([97fc289](https://github.com/hunny0025/ZerithDB/commit/97fc289c6ecb2cd9d6e928dd00954638fc74685c))
* **infra:** add JWT authentication middleware to signaling server ([#854](https://github.com/hunny0025/ZerithDB/issues/854)) ([1a17a4d](https://github.com/hunny0025/ZerithDB/commit/1a17a4d1c655b871591bada9b632b6d5f377e458))
* **network:** add ENS resolution and decentralized peer naming system ([#853](https://github.com/hunny0025/ZerithDB/issues/853)) ([82fcfdb](https://github.com/hunny0025/ZerithDB/commit/82fcfdb10a345eb38578ea91c5833ab356330e89))
* **network:** add graceful HTTP long-polling fallback for signaling transport ([e3ff346](https://github.com/hunny0025/ZerithDB/commit/e3ff346eabc971c55742b70693dbae4b617748aa))
* **network:** add multi-server signaling failover support ([#610](https://github.com/hunny0025/ZerithDB/issues/610)) ([b1fb6f9](https://github.com/hunny0025/ZerithDB/commit/b1fb6f9921b1144bf2ab88d4553a65e506397bd7))
* **playground:** improve onboarding with quick-start guide and interactive empty states ([#691](https://github.com/hunny0025/ZerithDB/issues/691)) ([d0f77c1](https://github.com/hunny0025/ZerithDB/commit/d0f77c15ba6ae09c17deab2b5060f5cfef302f53))
* production launch — web app, HF signaling, Python SDK, CLI ([7c655a1](https://github.com/hunny0025/ZerithDB/commit/7c655a140c2ed34cefbcf50486e9418db2bc21f0))
* **sdk:** add connectivity status tracking to sync and network ([#444](https://github.com/hunny0025/ZerithDB/issues/444)) ([135113a](https://github.com/hunny0025/ZerithDB/commit/135113ae18f43a667c1f54746c084d4f26414d2f))
* **ui:** add Copy to Clipboard functionality for Identity Public Keys ([#242](https://github.com/hunny0025/ZerithDB/issues/242)) ([1f6a7bf](https://github.com/hunny0025/ZerithDB/commit/1f6a7bf5ac32faf302fccfbdf444a63ae6a8fbe3))
* **web:** add dark mode theme toggle ([df01d38](https://github.com/hunny0025/ZerithDB/commit/df01d38bac38e3df7d3d3ec52e8cfe841e355cff))


### Bug Fixes

* **core:** add missing network-manager orchestration for video-conferencing ([1e9920a](https://github.com/hunny0025/ZerithDB/commit/1e9920a765b187b26ac86a8ade8df0d8de7f439c))
* **core:** add missing network-manager orchestration for video-conferencing ([0fba9b8](https://github.com/hunny0025/ZerithDB/commit/0fba9b8331d59ac3b1d18baa83761d64c0d49028))
* **core:** reorder types export condition across workspace ([#695](https://github.com/hunny0025/ZerithDB/issues/695)) ([d5e062b](https://github.com/hunny0025/ZerithDB/commit/d5e062b6ba10b0e97c5def92223304e1fae9717e))
* **network:** handle JSON.parse errors for signaling messages ([#846](https://github.com/hunny0025/ZerithDB/issues/846)) ([f67995f](https://github.com/hunny0025/ZerithDB/commit/f67995f74dad6fa0daa2e89e1ce968d698ae4b9f))
* remove lint and test scripts from stub packages ([37bece9](https://github.com/hunny0025/ZerithDB/commit/37bece9af8e97798541f74393a946e803e9e5178))
* reset React state on Clear DB button click ([#512](https://github.com/hunny0025/ZerithDB/issues/512)) ([05e138e](https://github.com/hunny0025/ZerithDB/commit/05e138eeca4d5fba5b899d39e677ecaf4862eaaa))
* resolve 10 bugs across sync, network, db, react, sdk, and cli packages ([#469](https://github.com/hunny0025/ZerithDB/issues/469)) ([e357900](https://github.com/hunny0025/ZerithDB/commit/e357900cbab5b38879c0c3b36123e3d2dc2ea8b6))
* resolve 404 error on blog footer link ([#581](https://github.com/hunny0025/ZerithDB/issues/581)) ([51f83f8](https://github.com/hunny0025/ZerithDB/commit/51f83f88c55a7ea2ee8f3562cc6ebd6c13585913))
* resolve all merge conflicts with upstream/main ([313ab38](https://github.com/hunny0025/ZerithDB/commit/313ab38e0510c41117b01dcb87abc1aef06ec3e8))
* resolve merge conflicts with upstream/main ([f449ebd](https://github.com/hunny0025/ZerithDB/commit/f449ebd68f3f7caacaa04021d10eea4930050230))
* **sdk:** resolve conflicts and improve indexeddb check ([de3df7f](https://github.com/hunny0025/ZerithDB/commit/de3df7fda130d34ac5bc6c68edabea596c9ce74a))
* **sdk:** validate appId in createApp ([#438](https://github.com/hunny0025/ZerithDB/issues/438)) ([62b810a](https://github.com/hunny0025/ZerithDB/commit/62b810abb60068e302cdb972fba0c3a0dc4cf3f9))
* stabilize monorepo build, fix types and missing layouts ([43bbc78](https://github.com/hunny0025/ZerithDB/commit/43bbc78dfe4ec204fdc1afba29bdfaf9ee93174b))
* **web:** repair landing page footer links ([#564](https://github.com/hunny0025/ZerithDB/issues/564)) ([c00b696](https://github.com/hunny0025/ZerithDB/commit/c00b6969f5735b2286fb673c6fdcd7229fdda213))

## 0.2.0

### Minor Changes

- 4f1cee0: Initial Beta Release of ZerithDB ecosystem! Features include CRDT sync, local-first
  WebRTC networking, React hooks, CLI, and more.

### Patch Changes

- Updated dependencies [4f1cee0]
  - zerithdb-core@0.2.0
  - zerithdb-auth@0.2.0
