# zerithdb-core

## [0.1.0](https://github.com/hunny0025/ZerithDB/compare/zerithdb-core-v0.0.1...zerithdb-core-v0.1.0) (2026-05-17)


### Features

* add centralized Logger utility with level support ([#440](https://github.com/hunny0025/ZerithDB/issues/440)) ([0be4a05](https://github.com/hunny0025/ZerithDB/commit/0be4a0593a87860d203746cded639f28ac8762fa))
* add polling transport fallback ([8c9ad5d](https://github.com/hunny0025/ZerithDB/commit/8c9ad5d38ecd873bd9878ebcb3d4056dbccdf0df))
* **cli:** add global experimental flag for beta features ([#625](https://github.com/hunny0025/ZerithDB/issues/625)) ([c219504](https://github.com/hunny0025/ZerithDB/commit/c219504b9796cecfb0febaa88add5f0a6c60aefe))
* **devtools:** memory usage visualizer for IndexedDB and WebRTC ([#511](https://github.com/hunny0025/ZerithDB/issues/511)) ([febd74e](https://github.com/hunny0025/ZerithDB/commit/febd74e395ee2e598a063d9dbad0f779e4a2c3fe))
* **examples:** add visual offline indicator to Playground ([#32](https://github.com/hunny0025/ZerithDB/issues/32)) ([f1b26bd](https://github.com/hunny0025/ZerithDB/commit/f1b26bd7c410ff47bd71ec39afa0f9f4312f3dc8))
* Implemented optiona schema validation using Zod: [#491](https://github.com/hunny0025/ZerithDB/issues/491) ([#513](https://github.com/hunny0025/ZerithDB/issues/513)) ([f15a1a5](https://github.com/hunny0025/ZerithDB/commit/f15a1a524b2a1759ffd23f08247fc7626031a023))
* improve framework icon styles and add floating animations ([#562](https://github.com/hunny0025/ZerithDB/issues/562)) ([97fc289](https://github.com/hunny0025/ZerithDB/commit/97fc289c6ecb2cd9d6e928dd00954638fc74685c))
* **infra:** add JWT authentication middleware to signaling server ([#854](https://github.com/hunny0025/ZerithDB/issues/854)) ([1a17a4d](https://github.com/hunny0025/ZerithDB/commit/1a17a4d1c655b871591bada9b632b6d5f377e458))
* **network:** add ENS resolution and decentralized peer naming system ([#853](https://github.com/hunny0025/ZerithDB/issues/853)) ([82fcfdb](https://github.com/hunny0025/ZerithDB/commit/82fcfdb10a345eb38578ea91c5833ab356330e89))
* **network:** add graceful HTTP long-polling fallback for signaling transport ([e3ff346](https://github.com/hunny0025/ZerithDB/commit/e3ff346eabc971c55742b70693dbae4b617748aa))
* **network:** add multi-server signaling failover support ([#610](https://github.com/hunny0025/ZerithDB/issues/610)) ([b1fb6f9](https://github.com/hunny0025/ZerithDB/commit/b1fb6f9921b1144bf2ab88d4553a65e506397bd7))
* **playground:** improve onboarding with quick-start guide and interactive empty states ([#691](https://github.com/hunny0025/ZerithDB/issues/691)) ([d0f77c1](https://github.com/hunny0025/ZerithDB/commit/d0f77c15ba6ae09c17deab2b5060f5cfef302f53))
* production launch — web app, HF signaling, Python SDK, CLI ([7c655a1](https://github.com/hunny0025/ZerithDB/commit/7c655a140c2ed34cefbcf50486e9418db2bc21f0))
* **sdk:** add connectivity status tracking to sync and network ([#444](https://github.com/hunny0025/ZerithDB/issues/444)) ([135113a](https://github.com/hunny0025/ZerithDB/commit/135113ae18f43a667c1f54746c084d4f26414d2f))
* **workflow:** add automatic duplicate issue detection and spam labeling ([#835](https://github.com/hunny0025/ZerithDB/issues/835)) ([d8f2240](https://github.com/hunny0025/ZerithDB/commit/d8f2240daf78da33d677ce84cbd5f77a3fc53353))
* **workflow:** add automatic duplicate issue detection and spam labeling ([#842](https://github.com/hunny0025/ZerithDB/issues/842)) ([df472ae](https://github.com/hunny0025/ZerithDB/commit/df472ae056f50fc7824fa5e505f96364321ac4bd))


### Bug Fixes

* add missing deps for CI build and lint ([c5abde3](https://github.com/hunny0025/ZerithDB/commit/c5abde3004205bef38df394eb1994f4e480a919e))
* **ci:** add fallback Groq API key to handle 429 rate-limit errors ([#719](https://github.com/hunny0025/ZerithDB/issues/719)) ([9cf1abf](https://github.com/hunny0025/ZerithDB/commit/9cf1abf3b9015e014af2227c080748c88cbaa8f9))
* **core:** add missing network-manager orchestration for video-conferencing ([1e9920a](https://github.com/hunny0025/ZerithDB/commit/1e9920a765b187b26ac86a8ade8df0d8de7f439c))
* **core:** add missing network-manager orchestration for video-conferencing ([0fba9b8](https://github.com/hunny0025/ZerithDB/commit/0fba9b8331d59ac3b1d18baa83761d64c0d49028))
* **core:** add missing SDK_UNSUPPORTED_ENVIRONMENT to ErrorCode enum ([3d78e7e](https://github.com/hunny0025/ZerithDB/commit/3d78e7ead41824a35acae8b79d950487a90f6e6b))
* **core:** add missing SDK_UNSUPPORTED_ENVIRONMENT to ErrorCode enum ([231d8dc](https://github.com/hunny0025/ZerithDB/commit/231d8dcdab27d3282510bb9ea39d89cf28ddcd14))
* **core:** reorder types export condition across workspace ([#695](https://github.com/hunny0025/ZerithDB/issues/695)) ([d5e062b](https://github.com/hunny0025/ZerithDB/commit/d5e062b6ba10b0e97c5def92223304e1fae9717e))
* **core:** resolve memory leak in EventEmitter.once() ([#483](https://github.com/hunny0025/ZerithDB/issues/483)) ([4af794b](https://github.com/hunny0025/ZerithDB/commit/4af794bfb81a40ac8a16f7d099a8b602b695badc))
* navbar hover text color visibility in dark mode ([#672](https://github.com/hunny0025/ZerithDB/issues/672)) ([fc0b3f5](https://github.com/hunny0025/ZerithDB/commit/fc0b3f54708a50f9deba73a852da0e8bac607f01))
* remove test script from core package ([3c12ea2](https://github.com/hunny0025/ZerithDB/commit/3c12ea2e18a147b4008012c9ae7be37e298d3c9d))
* reset React state on Clear DB button click ([#512](https://github.com/hunny0025/ZerithDB/issues/512)) ([05e138e](https://github.com/hunny0025/ZerithDB/commit/05e138eeca4d5fba5b899d39e677ecaf4862eaaa))
* resolve all CI failures permanently ([c42c2ea](https://github.com/hunny0025/ZerithDB/commit/c42c2eaf9b728d260d586226e0c7ea895cba2d34))
* resolve all merge conflicts with upstream/main ([313ab38](https://github.com/hunny0025/ZerithDB/commit/313ab38e0510c41117b01dcb87abc1aef06ec3e8))
* resolve CI lint failures ([e90fd2d](https://github.com/hunny0025/ZerithDB/commit/e90fd2d985e89157e4371fadfcdc0d10ffa39dcb))
* resolve final CI failures ([f6767a6](https://github.com/hunny0025/ZerithDB/commit/f6767a6025a3750256b3cbb45733bb52d19de2b3))
* resolve merge conflicts with upstream/main ([f449ebd](https://github.com/hunny0025/ZerithDB/commit/f449ebd68f3f7caacaa04021d10eea4930050230))
* **sdk:** resolve conflicts and improve indexeddb check ([de3df7f](https://github.com/hunny0025/ZerithDB/commit/de3df7fda130d34ac5bc6c68edabea596c9ce74a))
* **sdk:** validate appId in createApp ([#438](https://github.com/hunny0025/ZerithDB/issues/438)) ([62b810a](https://github.com/hunny0025/ZerithDB/commit/62b810abb60068e302cdb972fba0c3a0dc4cf3f9))
* stabilize monorepo build, fix types and missing layouts ([43bbc78](https://github.com/hunny0025/ZerithDB/commit/43bbc78dfe4ec204fdc1afba29bdfaf9ee93174b))
* **sync:** integrate ephemeral sync state manager with sync engine ([e499fef](https://github.com/hunny0025/ZerithDB/commit/e499fef9ee37613cdf164308e0cbff42975e0b22))
* **types:** preserve metadata inference in Document&lt;T&gt; ([#617](https://github.com/hunny0025/ZerithDB/issues/617)) ([62c4833](https://github.com/hunny0025/ZerithDB/commit/62c48331060049fe9fe6b2974b146c3e8b2f9d7b))
* **web:** repair landing page footer links ([#564](https://github.com/hunny0025/ZerithDB/issues/564)) ([c00b696](https://github.com/hunny0025/ZerithDB/commit/c00b6969f5735b2286fb673c6fdcd7229fdda213))

## 0.2.0

### Minor Changes

- 4f1cee0: Initial Beta Release of ZerithDB ecosystem! Features include CRDT sync, local-first
  WebRTC networking, React hooks, CLI, and more.
