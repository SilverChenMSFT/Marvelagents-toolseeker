# Marvelagents-toolseeker

Electron + Vite app for finding GitHub tools/agents from a natural-language description and generating an HTML report.

## Run

```bash
npm install
npm run build
npm run dev
```

In another terminal, launch Electron against the running Vite app:

```bash
VITE_DEV_SERVER_URL=http://localhost:5173 npm run electron
```
