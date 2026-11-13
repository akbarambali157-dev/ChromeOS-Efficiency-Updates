# 3.5.0-F — Forty-entry catalogue

## Added
- Expanded the public catalogue from twelve to forty entries.
- Marked twelve implemented first-party apps as live and twenty-eight as planned.
- Added explicit planned states to the extension marketplace and public Vercel storefront.
- Disabled installation for apps without locally bundled implementations.
- Added safe detail-page messaging for planned apps rather than a broken hosted launch.
- Added the full 40-app category list and staged implementation roadmap in `MINI-APP-CATALOGUE-40.md`.

## Important distinction
The catalogue has forty entries, but only twelve apps currently have bundled local implementations. The remaining twenty-eight are not installable. The 40-app target is not being represented as forty completed apps.

## Verification
- Catalogue JSON parses and contains forty unique IDs.
- Twelve entries are live; twenty-eight entries have status `planned`.
- Extension and storefront JavaScript syntax checks remain required after this catalogue update.
