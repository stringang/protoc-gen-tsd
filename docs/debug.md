# Debugging

1. export env `export PATH="./bin:${PATH}"`
2. `protoc-gen-tsd` file `#!/usr/bin/env node --inspect-brk --require ts-node/register ./src/index.ts`
3. `protoc --tsd_out=. examples/protos/echo.proto`
4. `chrome://inspect`


## debugging ejs template

```ejs
<% debugger; -%>
```