# protoc-gen-tsd

> Protoc Plugin for generating TypeScript Declarations

## Quick Start

### Installation

```shell
npm install protoc-gen-tsd
```

### Usage

```shell
export PATH ="./node_modules/.bin/:$PATH"
protoc --tsd_out=. echo.proto
```

## Packaging Comparison

| `.d.ts` file  | `protoc-gen-tsd` | `ts-protoc-gen`    |
| ------------- | ---------------- | ------------------ |
| Get/Set field | :x:              | :heavy_check_mark: |
| dependencies  | :x:              | :heavy_check_mark: |

## Examples

- [example output](examples/protos/echo.d.ts)

## Debug

```shell
#!/usr/bin/env node --inspect-brk --require ts-node/register ./src/index.ts
export PATH ="./bin/:$PATH"
protoc --tsd_out=. examples/protos/echo.proto
```
