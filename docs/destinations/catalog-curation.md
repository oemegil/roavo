# Catalog curation

## Seed dataset

- ~27 internally curated destinations (cities, regions, islands, coastal areas)
- Upsert by stable `slug`
- Original concise editorial descriptions (not scraped provider marketing copy)
- No production hero photography in seed (placeholder-free; UI handles missing images)
- Provider references use `MANUAL` + `curated:{slug}` for traceability

## Commands

```bash
pnpm db:seed
```

Refuses to run in `production` unless `ALLOW_PROD_SEED=true`.

## Licensing

| Data | Source |
|------|--------|
| Names, coordinates, timezones, currencies | Internally curated public-knowledge facts |
| Descriptions / practical notes | Original Roavo editorial text |
| Images | Not bundled in seed; attribution fields reserved for licensed assets |

## Curation rules

- Prefer 20–40 high-quality records over large noisy sets
- Do not auto-publish user manual destinations
- Do not change published slugs casually
- Budget levels and durations are editorial planning guidance, not live prices
