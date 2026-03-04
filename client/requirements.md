## Packages
date-fns | Date formatting and manipulation
recharts | Dashboard charts and analytics visualization
lucide-react | Standard icons

## Notes
- Assume `/api/auth/me` returns 401 if not authenticated.
- Forms use `z.coerce` for number and date fields as they are serialized as strings in HTML inputs and JSON.
- `inventory` records contain `purchaseDate` which needs to be parsed to calculate depreciation.
