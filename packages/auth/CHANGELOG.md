# zerithdb-auth

## [0.1.0](https://github.com/hunny0025/ZerithDB/compare/zerithdb-auth-v0.0.1...zerithdb-auth-v0.1.0) (2026-05-17)


### Features

* add sharedworker-backed multi-tab sync ([#505](https://github.com/hunny0025/ZerithDB/issues/505)) ([039c1c8](https://github.com/hunny0025/ZerithDB/commit/039c1c8de7195f8388061afd64e105e52bd2655b))
* **auth:** implement timingSafeEqual to mitigate peer sync timing attacks ([4e7c951](https://github.com/hunny0025/ZerithDB/commit/4e7c951796ed25ae81d6f82790a5b361828b08e0))
* **auth:** mitigate sync timing attacks via timingSafeEqual ([f797a60](https://github.com/hunny0025/ZerithDB/commit/f797a609260fada4af3b10e4561f09f651cb836c))
* **cli:** add global experimental flag for beta features ([#625](https://github.com/hunny0025/ZerithDB/issues/625)) ([c219504](https://github.com/hunny0025/ZerithDB/commit/c219504b9796cecfb0febaa88add5f0a6c60aefe))
* **examples:** add visual offline indicator to Playground ([#32](https://github.com/hunny0025/ZerithDB/issues/32)) ([f1b26bd](https://github.com/hunny0025/ZerithDB/commit/f1b26bd7c410ff47bd71ec39afa0f9f4312f3dc8))
* implement social recovery via shamir's secret sharing ([#631](https://github.com/hunny0025/ZerithDB/issues/631)) ([1cead77](https://github.com/hunny0025/ZerithDB/commit/1cead7798f808374be580c3139a8ba18366bcc5d))
* improve framework icon styles and add floating animations ([#562](https://github.com/hunny0025/ZerithDB/issues/562)) ([97fc289](https://github.com/hunny0025/ZerithDB/commit/97fc289c6ecb2cd9d6e928dd00954638fc74685c))
* **infra:** add JWT authentication middleware to signaling server ([#854](https://github.com/hunny0025/ZerithDB/issues/854)) ([1a17a4d](https://github.com/hunny0025/ZerithDB/commit/1a17a4d1c655b871591bada9b632b6d5f377e458))
* **playground:** improve onboarding with quick-start guide and interactive empty states ([#691](https://github.com/hunny0025/ZerithDB/issues/691)) ([d0f77c1](https://github.com/hunny0025/ZerithDB/commit/d0f77c15ba6ae09c17deab2b5060f5cfef302f53))
* production launch — web app, HF signaling, Python SDK, CLI ([7c655a1](https://github.com/hunny0025/ZerithDB/commit/7c655a140c2ed34cefbcf50486e9418db2bc21f0))
* **react:** fix useQuery API and add useAuth / useSync hooks ([d9fb3ca](https://github.com/hunny0025/ZerithDB/commit/d9fb3cac4e926ef2091f90c85e0cf1c7cd22a3ad))
* **sdk:** add connectivity status tracking to sync and network ([#444](https://github.com/hunny0025/ZerithDB/issues/444)) ([135113a](https://github.com/hunny0025/ZerithDB/commit/135113ae18f43a667c1f54746c084d4f26414d2f))
* **workflow:** add automatic duplicate issue detection and spam labeling ([#835](https://github.com/hunny0025/ZerithDB/issues/835)) ([d8f2240](https://github.com/hunny0025/ZerithDB/commit/d8f2240daf78da33d677ce84cbd5f77a3fc53353))
* **workflow:** add automatic duplicate issue detection and spam labeling ([#842](https://github.com/hunny0025/ZerithDB/issues/842)) ([df472ae](https://github.com/hunny0025/ZerithDB/commit/df472ae056f50fc7824fa5e505f96364321ac4bd))


### Bug Fixes

* **core:** reorder types export condition across workspace ([#695](https://github.com/hunny0025/ZerithDB/issues/695)) ([d5e062b](https://github.com/hunny0025/ZerithDB/commit/d5e062b6ba10b0e97c5def92223304e1fae9717e))
* **db,sdk,auth:** add input validation guards for edge case inputs (issue [#552](https://github.com/hunny0025/ZerithDB/issues/552)) ([#618](https://github.com/hunny0025/ZerithDB/issues/618)) ([8b06d45](https://github.com/hunny0025/ZerithDB/commit/8b06d451a39753bc7346f7b3cef33987037c16fe))
* **react:** address copilot review feedback ([c43dd9f](https://github.com/hunny0025/ZerithDB/commit/c43dd9f697dec55d1be435aff1fdf53d27303e81))
* remove lint and test scripts from stub packages ([37bece9](https://github.com/hunny0025/ZerithDB/commit/37bece9af8e97798541f74393a946e803e9e5178))
* reset React state on Clear DB button click ([#512](https://github.com/hunny0025/ZerithDB/issues/512)) ([05e138e](https://github.com/hunny0025/ZerithDB/commit/05e138eeca4d5fba5b899d39e677ecaf4862eaaa))
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
