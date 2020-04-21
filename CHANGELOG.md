## v0.2.2

- plugin: The `Plugin` constructor argument must be an object (`dynamic` boolean
    deprecated but still supported).
- plugin: We now append `\n\n` to our writes on stdout.
- plugin: We don't try to log on write error anymore.

- rpc: We now fully support multi-chunks RPC responses from `lightningd`.
- rpc: We now handle socket reconnection correctly.

## v0.2.1 and below

Not filled
