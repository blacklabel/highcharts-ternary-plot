# Changelog

## [2.0.0] — 2026-04-07

### Breaking changes

- Series data keys renamed: `x`, `y`, `z` → `a`, `b`, `c`
- `ternaryAxis` structure changed — each axis (`a`, `b`, `c`) is now configured as a separate key under `ternaryAxis` instead of a flat options object
- `chart.ternary` now accepts a configuration object in addition to `true`

### New features

- **TypeScript** — type declarations included in the package (`types/index.d.ts`)
- **JSDoc** — all public options documented with JSDoc
- **`componentColors`** — color each axis component independently; supports `a`, `b`, `c` color keys and `alpha` for blending
- **`minSize` / `maxSize`** — control bubble size range for scatter series (replaces ad-hoc sizing)
- **`median`** — configure the median lines as `boolean` or an object with style options (`color`, `width`, `dashStyle`)
- **`ternaryAngle`** — control the projection angle of the triangle
- **`title.titlePosition`** — set axis title position (`corner`, `side`, or custom)
- **`title.offsetDirection`** — control which direction the axis title offsets from the axis
- **`title.margin`** / **`labels.margin`** — fine-tune spacing between titles, labels, and the triangle
- **`gridLineDashStyle`** — dash style support for grid lines
- **`chart.sumTo`** — normalize data to a sum other than 100
- **`lineColor` / `lineWidth` / `lineDashStyle`** — style the triangle sides (axis lines) independently from internal grid lines; previously both used `gridLineColor` / `gridLineWidth`

---

## [1.0.0] — initial release
