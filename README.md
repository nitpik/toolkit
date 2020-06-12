# Nitpik Toolkit

by [Nicholas C. Zakas](https://humanwhocodes.com)

![Node CI](https://github.com/nitpik/toolkit/workflows/Node%20CI/badge.svg)

If you find this useful, please consider supporting my work with a [donation](https://humanwhocodes.com/donate).

## Description

A toolkit for building Nitpik formatters.

### Status

**Prototype** - Seeking feedback and not ready for production use.

## Usage

### Node.js

Install using [npm][npm] or [yarn][yarn]:

```
npm install @nitpik/toolkit --save

# or

yarn add @nitpik/toolkit
```

Import into your Node.js project:

```js
// CommonJS
const { TokenList } = require("@nitpik/toolkit");

// ESM
import { TokenList } from "@nitpik/toolkit";
```

### Deno

Import into your Deno project:

```js
import { TokenList } from "https://unpkg.com/@nitpik/toolkit/dist/pkg.js";
```

### Browser

Import into a browser script:

```js
import { TokenList } from "https://unpkg.com/@nitpik/toolkit/dist/pkg.js";
```



### Developer Setup

1. Ensure you have [Node.js](https://nodejs.org) 12+ installed
2. Fork and clone this repository
3. Run `npm install`
4. Run `npm test` to run tests

## License and Copyright

This code is licensed under the Apache 2.0 License (see LICENSE for details).

Copyright Human Who Codes LLC. All rights reserved.
