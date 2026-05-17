# @zerithdb/astro

Astro integration for ZerithDB.

## Installation

```bash
npm install @zerithdb/astro
```

## Usage

```js
import { defineConfig } from "astro/config";
import zerithdb from "@zerithdb/astro";

export default defineConfig({
  integrations: [zerithdb()],
});
```
