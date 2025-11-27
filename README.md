# DevAsc Sample App

Features:
- User registration & login (JWT)
- Items (create/search/get/delete)
- Dashboard endpoint (simple metrics)
- Tests (Jest + SuperTest)
- GitHub Actions workflow runs tests on push/PR

## Setup

1. Copy `.env.example` to `.env` and update if needed.
2. Install:
npm install
3. Run locally
npm start

App listens on `http://localhost:3000`.
## Tests
npm test


## Notes
- DB is a SQLite file at `data/database.sqlite` by default.
- For CI, GitHub Actions sets `DB_FILE` to `./data/ci.sqlite`.
