# protoc-gen-tsd

> Protoc Plugin for generating TypeScript definition

The library exports the `protoc-gen-tsd` executable, which generates a TypeScript definition file(`.d.ts` file).

## Quick Start

### Installation

```shell
npm install protoc-gen-tsd
```

### Usage

```shell
export PATH ="./node_modules/.bin/:$PATH"
protoc --tsd_out=./examples/protos ./examples/protos/echo.proto
protoc --tsd_out=./examples/protos -I=./examples/protos ./examples/protos/*.proto
```

## Packaging Comparison

Some time ago, gRPC released pure JavaScript implementation of client `@grpc/grpc-js` without a C++ addon.

The `@grpc/grpc-js` load package definition object(`grpc.loadPackageDefinition`) requires a `@grpc/proto-loader` to load the `proto` file.

`@grpc/grpc-js` serialization and deserialization protocol buffer messages depend on the `@grpc/proto-loader` output package definition object.

When we get the protocol buffer message, it has been deserialized and we can get the information directly from the property accessor.

So, to work with TypeScript you only need to declare the type protobuf message.

| `.d.ts` file                 | `protoc-gen-tsd`   | `ts-protoc-gen`    |
| ---------------------------- | ------------------ | ------------------ |
| get/set field                | :x:                | :heavy_check_mark: |
| `google-protobuf` dependency | :x:                | :heavy_check_mark: |
| `grpc` dependency            | :x:                | :heavy_check_mark: |
| `@grpc/grpc-js` dependency   | :heavy_check_mark: | :x:                |

## Examples

- [example output](examples/protos/echo.d.ts)

## Debug

```shell
#!/usr/bin/env node --inspect-brk --require ts-node/register ./src/index.ts
export PATH ="./bin/:$PATH"
protoc --tsd_out=. examples/protos/echo.proto
```
