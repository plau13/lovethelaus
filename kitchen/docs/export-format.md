# Recipe export format

`GET /api/export` downloads a JSON file of every recipe the signed-in user can access.

This is the anti-lock-in format. Keep it stable. Version field is `1`.

```json
{
  "version": 1,
  "exportedAt": "2026-08-31T00:00:00.000Z",
  "recipes": [
    {
      "id": "cuid",
      "title": "Soy sauce chicken",
      "ingredients": ["1 chicken", "1/2 cup soy sauce"],
      "steps": ["Brown the chicken.", "Simmer 40 minutes."],
      "servings": 4,
      "tags": ["chicken", "weeknight"],
      "sourceType": "typed",
      "sourceUrl": null,
      "sourceAttribution": null,
      "notes": ["Don't skip the rest."],
      "updatedAt": "2026-08-31T00:00:00.000Z"
    }
  ]
}
```

CSV is also available at `GET /api/export?format=csv` (title, tags, ingredients, source URL only).
