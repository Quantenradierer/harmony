# Harmony Trainer

Ear-training PWA (notes, intervals, chords). npm-workspaces monorepo:

- `shared/` – types and logic shared by web and server
- `web/` – Vite + Svelte PWA
- `server/` – Node/Hono server serving the PWA and `/api`

## Development

```sh
npm install
npm test          # unit tests in every workspace
npm run check     # type checks
npm run build     # build web and server
npm start         # serve the built app on http://localhost:3000
```

## Docker

```sh
docker compose up -d --build   # builds and starts the single container
```
