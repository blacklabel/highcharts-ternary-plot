# Release checklist

Steps to follow before every `npm publish`.

## 1. Verify

- [ ] `npm test` — all tests pass
- [ ] `npm run build` — build passes, no lint/TS errors
- [ ] `js/ternary-plot.js` header — correct version and year
- [ ] `package.json` — correct `version`
- [ ] `CHANGELOG.md` — entry exists for this version with today's date

## 2. Preview what npm will publish

```bash
npm pack --dry-run
```

Confirm only `js/ternary-plot.js` and `types/` are included. No source files, no `dev.html`, no test files.

## 3. Git

```bash
git add .
git commit -m "Release v2.0.0"
git tag v2.0.0
```

Merge or rebase onto `main`, then:

```bash
git push origin main
git push origin v2.0.0
```

## 4. Publish

```bash
npm publish
```

## 5. After publish

- [ ] Verify on [npmjs.com/package/highcharts-ternary-plot](https://www.npmjs.com/package/highcharts-ternary-plot) — correct version, files, readme
- [ ] Create GitHub Release for tag `v2.0.0` — paste CHANGELOG entry as description
- [ ] Update CDN link in `index.html` if the version number changed (currently `@2.0.0`)
