# DA Manager

Local dashboard for managing DataAnnotation laptops, profiles, payments, and assessment tests.

## Features

- **Laptops & profiles** — country, name, LinkedIn, AnyDesk ID, password (show/hide), rent start, payment method/amount/date
- **Test manager** — track assessments with start/check dates, status (pending / fresh / end), pass/fail, and stored answers
- **Reminders** — banner alerts when a pending test reaches its check date
- **Import / Export** — JSON backup (data is stored in browser `localStorage`)

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```
