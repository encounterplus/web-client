# Game icons

The icon font status effects draw with, bundled so tokens need no extra round trip.

- `game-icons.json` maps each icon name (`gi-poisoned`) to its glyph. It is compiled into the
  bundle.
- `src/fonts/Game-Icons.ttf` is the font, declared in `src/styles.scss`.

Both are copies of `EncounterPlus/Resources/Fonts/Game-Icons.{ttf,json}` in the app. Re-sync them
together when the app's icon set changes. The app's JSON has a trailing comma, which is not valid
JSON, so strip it when copying. An icon the copy does not know draws as `gi-duration`, so a stale
copy loses icons rather than breaking.
