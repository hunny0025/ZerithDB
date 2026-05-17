# zerithdb-sdk

## [0.1.0](https://github.com/hunny0025/ZerithDB/compare/zerithdb-sdk-v0.0.1...zerithdb-sdk-v0.1.0) (2026-05-17)


### Features

* add centralized Logger utility with level support ([#440](https://github.com/hunny0025/ZerithDB/issues/440)) ([0be4a05](https://github.com/hunny0025/ZerithDB/commit/0be4a0593a87860d203746cded639f28ac8762fa))
* add P2P video conferencing orchestration ([#527](https://github.com/hunny0025/ZerithDB/issues/527)) ([0f839eb](https://github.com/hunny0025/ZerithDB/commit/0f839eba43629c5fcfdfcd5560e1b771dc045f3a))
* add polling transport fallback ([8c9ad5d](https://github.com/hunny0025/ZerithDB/commit/8c9ad5d38ecd873bd9878ebcb3d4056dbccdf0df))
* **cli:** add global experimental flag for beta features ([#625](https://github.com/hunny0025/ZerithDB/issues/625)) ([c219504](https://github.com/hunny0025/ZerithDB/commit/c219504b9796cecfb0febaa88add5f0a6c60aefe))
* **devtools:** memory usage visualizer for IndexedDB and WebRTC ([#511](https://github.com/hunny0025/ZerithDB/issues/511)) ([febd74e](https://github.com/hunny0025/ZerithDB/commit/febd74e395ee2e598a063d9dbad0f779e4a2c3fe))
* **examples:** add visual offline indicator to Playground ([#32](https://github.com/hunny0025/ZerithDB/issues/32)) ([f1b26bd](https://github.com/hunny0025/ZerithDB/commit/f1b26bd7c410ff47bd71ec39afa0f9f4312f3dc8))
* Implemented optiona schema validation using Zod: [#491](https://github.com/hunny0025/ZerithDB/issues/491) ([#513](https://github.com/hunny0025/ZerithDB/issues/513)) ([f15a1a5](https://github.com/hunny0025/ZerithDB/commit/f15a1a524b2a1759ffd23f08247fc7626031a023))
* improve framework icon styles and add floating animations ([#562](https://github.com/hunny0025/ZerithDB/issues/562)) ([97fc289](https://github.com/hunny0025/ZerithDB/commit/97fc289c6ecb2cd9d6e928dd00954638fc74685c))
* **infra:** add JWT authentication middleware to signaling server ([#854](https://github.com/hunny0025/ZerithDB/issues/854)) ([1a17a4d](https://github.com/hunny0025/ZerithDB/commit/1a17a4d1c655b871591bada9b632b6d5f377e458))
* **network:** add ENS resolution and decentralized peer naming system ([#853](https://github.com/hunny0025/ZerithDB/issues/853)) ([82fcfdb](https://github.com/hunny0025/ZerithDB/commit/82fcfdb10a345eb38578ea91c5833ab356330e89))
* **network:** add graceful HTTP long-polling fallback for signaling transport ([e3ff346](https://github.com/hunny0025/ZerithDB/commit/e3ff346eabc971c55742b70693dbae4b617748aa))
* **playground:** improve onboarding with quick-start guide and interactive empty states ([#691](https://github.com/hunny0025/ZerithDB/issues/691)) ([d0f77c1](https://github.com/hunny0025/ZerithDB/commit/d0f77c15ba6ae09c17deab2b5060f5cfef302f53))
* production launch — web app, HF signaling, Python SDK, CLI ([7c655a1](https://github.com/hunny0025/ZerithDB/commit/7c655a140c2ed34cefbcf50486e9418db2bc21f0))
* **sdk:** add connectivity status tracking to sync and network ([#444](https://github.com/hunny0025/ZerithDB/issues/444)) ([135113a](https://github.com/hunny0025/ZerithDB/commit/135113ae18f43a667c1f54746c084d4f26414d2f))
* **web:** add dark mode theme toggle ([df01d38](https://github.com/hunny0025/ZerithDB/commit/df01d38bac38e3df7d3d3ec52e8cfe841e355cff))


### Bug Fixes

* **core:** reorder types export condition across workspace ([#695](https://github.com/hunny0025/ZerithDB/issues/695)) ([d5e062b](https://github.com/hunny0025/ZerithDB/commit/d5e062b6ba10b0e97c5def92223304e1fae9717e))
* remove lint and test scripts from stub packages ([37bece9](https://github.com/hunny0025/ZerithDB/commit/37bece9af8e97798541f74393a946e803e9e5178))
* reset React state on Clear DB button click ([#512](https://github.com/hunny0025/ZerithDB/issues/512)) ([05e138e](https://github.com/hunny0025/ZerithDB/commit/05e138eeca4d5fba5b899d39e677ecaf4862eaaa))
* resolve 10 bugs across sync, network, db, react, sdk, and cli packages ([#469](https://github.com/hunny0025/ZerithDB/issues/469)) ([e357900](https://github.com/hunny0025/ZerithDB/commit/e357900cbab5b38879c0c3b36123e3d2dc2ea8b6))
* resolve all merge conflicts with upstream/main ([313ab38](https://github.com/hunny0025/ZerithDB/commit/313ab38e0510c41117b01dcb87abc1aef06ec3e8))
* resolve merge conflicts with upstream/main ([f449ebd](https://github.com/hunny0025/ZerithDB/commit/f449ebd68f3f7caacaa04021d10eea4930050230))
* **sdk:** handle missing IndexedDB gracefully ([3b1ac9d](https://github.com/hunny0025/ZerithDB/commit/3b1ac9dc3c6dc5a84aee67dfc5ea5196cc393dc8))
* **sdk:** handle missing IndexedDB gracefully ([fedbaf2](https://github.com/hunny0025/ZerithDB/commit/fedbaf2ec2b69adf75638803efc3790ae73f532d))
* **sdk:** resolve conflicts and improve indexeddb check ([de3df7f](https://github.com/hunny0025/ZerithDB/commit/de3df7fda130d34ac5bc6c68edabea596c9ce74a))
* **sdk:** validate appId in createApp ([#438](https://github.com/hunny0025/ZerithDB/issues/438)) ([62b810a](https://github.com/hunny0025/ZerithDB/commit/62b810abb60068e302cdb972fba0c3a0dc4cf3f9))
* **sdk:** validate appId in createApp() ([#593](https://github.com/hunny0025/ZerithDB/issues/593)) ([e9b1c88](https://github.com/hunny0025/ZerithDB/commit/e9b1c88ccd097717916fca97a7facc4baf0251b6))
* stabilize monorepo build, fix types and missing layouts ([43bbc78](https://github.com/hunny0025/ZerithDB/commit/43bbc78dfe4ec204fdc1afba29bdfaf9ee93174b))
* **web:** repair landing page footer links ([#564](https://github.com/hunny0025/ZerithDB/issues/564)) ([c00b696](https://github.com/hunny0025/ZerithDB/commit/c00b6969f5735b2286fb673c6fdcd7229fdda213))


### Performance Improvements

* optimize homepage component loading ([da9b642](https://github.com/hunny0025/ZerithDB/commit/da9b642dac44d63f30d12716cd9276d7d4374c29))

## 0.2.0

### Minor Changes

- 4f1cee0: Initial Beta Release of ZerithDB ecosystem! Features include CRDT sync, local-first
  WebRTC networking, React hooks, CLI, and more.

### Patch Changes

- Updated dependencies [4f1cee0]
  - zerithdb-core@0.2.0
  - zerithdb-db@0.2.0
  - zerithdb-sync@0.2.0
  - zerithdb-network@0.2.0
  - zerithdb-auth@0.2.0
