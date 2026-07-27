# Trip domain

## Aggregate

- `Trip` is the aggregate root owned by a `User`
- No separate Itinerary table — days and items form the itinerary
- Soft delete via `deletedAt`
- Lifecycle: `DRAFT` | `ARCHIVED` (publishing later)

## Money

- `totalBudgetMinor` integer minor units + `currencyCode`
- Zero-decimal currencies (e.g. JPY) use factor 1

## Dates & times

- Trip/day dates: `@db.Date`, API `YYYY-MM-DD` (UTC calendar date, no shift)
- Item times: minutes from midnight, API `HH:mm` (local destination time)

## Ordering

- Dense `position` integers
- Reorder via full ordered ID lists in a transaction

## Ownership

- Session user is always the owner
- Foreign trips return `TRIP_NOT_FOUND`
- Archived trips are readable but not editable until restored
