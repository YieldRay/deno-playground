# deno-playground

[Demo](https://deno.488848.xyz)

Thanks to the following libraries for making this project possible:

- [`monaco-editor`](https://github.com/microsoft/monaco-editor): The code editor
- [`xterm.js`](https://github.com/xtermjs/xterm.js): The terminal emulator

Of course, this project also relies on other libraries, which are listed in the package.json file.

## Hosting the Backend

The backend is designed for running untrusted code, so please ensure that security is thoroughly considered.  
For example, you may run it in a sandbox environment like Docker.

```sh
deno run -A https://raw.githubusercontent.com/YieldRay/deno-playground/main/backend/deno.ts

# You can also run a backend to eval script via spawning bun process
deno run -A https://raw.githubusercontent.com/YieldRay/deno-playground/main/backend/bun.ts
```
