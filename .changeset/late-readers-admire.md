---
"@astrojs/cli-kit": patch
---

Fix ESM/CJS interoperability issues by upgrading log-update to latest and using `createRequire` for `sisteransi` package (CJS-only).
