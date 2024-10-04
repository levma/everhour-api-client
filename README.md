![Test](https://github.com/levma/everhour-api-client/actions/workflows/test.yml/badge.svg?event=push)
![Publish](https://github.com/levma/everhour-api-client/actions/workflows/publish.yml/badge.svg)

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

You can install it as dependency through JSR or NPM.

```sh
deno add jsr:@levma/everhour-api-client
```

```sh
npm i @levma/everhour-api-client
```

## Documentation

Refer to the [Everhour API blueprint](https://everhour.docs.apiary.io/) for more
documentation and examples.
