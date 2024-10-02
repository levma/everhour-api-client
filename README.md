# Everhour API Client

Simple client to use the everhour API in your javascript or typescript project
or on your website.

## State & Production Readiness

Beware: I won't consider this production ready. Only trust your own tests...
Background: The types, method signatures and comments derived from the
[Everhour API blueprint](https://everhour.docs.apiary.io/). The blueprint file
was processed with SwaggerHub to export typescript code. This resulted in file
with about 30k lines. I broke it down to 2k line by reducing code duplication
and simplifying the structure of the methods. As I only needed a fraction of the
API calls most of them are **UNTESTED!** So take it as it is and feel free to
contribute tests, fixes etc.

## Installation

You can install it as dependency through NPM or download it directly from the
releases page.

```sh
deno add @levma/everhour-api-client
```

```sh
npm i @levma/everhour-api-client
```

## Usage

### ECMAScript Module

The ES module is tree-shakable. Import only the functions you need:

```typescript
import { EverhourApiClient, getCurrentUser } from "everhour-api-client";

const client = new EverhourApiClient(process.env.EVERHOUR_API_KEY);
const currentProfile = await getCurrentUser(client);
```

### CommonJS Module

The CommonJS module contains all methods of the client:

```javascript
const api = require("everhour-api-client");
const client = new api.EverhourApiClient(process.env.EVERHOUR_API_KEY);
const currentProfile = await api.getCurrentUser(client);
```

### As a script in your HTML project

You can also use the client.min.js file from the releases in your HTML page.
Like the CommonJS module, it provides all available API methods under a single
global variable:

```html
<script src="client.min.js" defer></script>
<script>
  document.addEventListener("DOMContentLoaded", () => {
    const api = globalThis.EverhourApi;
    const client = new api.EverhourApiCLient(EVERHOUR_API_KEY);
    const currentProfile = await api.getCurrentUser(client);
  });
</script>
```

## Documentation

Refer to the [Everhour API blueprint](https://everhour.docs.apiary.io/) for more
documentation and examples.
