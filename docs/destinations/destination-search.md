# Destination search

## Strategy

MVP search runs against the internal PostgreSQL catalog only.

1. Normalize the query (`normalizeDestinationName`).
2. Filter `status = ACTIVE` plus optional type/country/category/budget/bestFor.
3. Match against `normalizedName`, display name, country, region, and `searchKeywords`.
4. Rank in application code for deterministic ordering.
5. Paginate with an id cursor after ranking (bounded candidate window).

## Ranking (deterministic)

1. Exact normalized-name match  
2. Prefix match  
3. Name substring  
4. Country / region match  
5. Keyword match  
6. Editorial `popularityScore`  
7. Stable id tie-breaker  

No personalization. No ML ranking.

## Input rules

- Trimmed query  
- Min 2 chars when `q` is provided  
- Max 100 chars  
- Client debounce ~300ms  
- Light in-memory rate limit on search API  

Logging policy: prefer query **length** and filters over full free-text queries.

## Filters

API: `q`, `type`, `countryCode`, `category`, `budgetLevel`, `bestFor`, `cursor`, `limit`  
UI (initial): category, budget level, best-for, plus text search  

## Evolution

Later options without Elasticsearch: Postgres trigram (`pg_trgm`), full-text search, or optional external provider candidates (never auto-promoted into the catalog).
