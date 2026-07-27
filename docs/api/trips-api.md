# Trips API

Base: `/api/v1`

Auth: session cookie (Auth.js). Future mobile clients will need a separate auth extension — not implemented here.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/trips` | List owned trips (`status`, `cursor`, `limit`) |
| POST | `/trips` | Create trip + days |
| GET | `/trips/:tripId` | Trip detail aggregate |
| PATCH | `/trips/:tripId` | Update metadata / dates |
| DELETE | `/trips/:tripId` | Soft delete |
| POST | `/trips/:tripId/archive` | Archive |
| POST | `/trips/:tripId/restore` | Restore |
| PATCH | `/trips/:tripId/days/:dayId` | Update day title/notes |
| PUT | `/trips/:tripId/days/reorder` | Reorder days |
| POST | `/trips/:tripId/days/:dayId/items` | Add item |
| PATCH | `/trips/:tripId/days/:dayId/items/:itemId` | Update item |
| DELETE | `/trips/:tripId/days/:dayId/items/:itemId` | Delete item |
| PUT | `/trips/:tripId/days/:dayId/items/reorder` | Reorder items |
| POST | `/trips/:tripId/items/:itemId/move` | Move item across days |

Money in requests uses major units (`totalBudgetMajor`); responses include both major and minor.
