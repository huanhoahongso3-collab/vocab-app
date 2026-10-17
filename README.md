# Vocab B2/C1

AI-generated vocabulary lists (level B2/C1 + topic). Paid app: free vs Premium limits are enforced on the server.
App id: `dhp.fatties.vocab`.

```
api/   Node + TypeScript + Fastify + SQLite: accounts, email codes, AI quota, sync, Google/Apple billing
app/   Flutter (Android, iOS, Web), offline-first saved words
```

## API (`api/`)

```bash
cd api
cp .env.example .env     # fill JWT_SECRET, CYO_AI_API (same key/URL/model as cbh-youth-online), SMTP_*, store credentials
npm install
npm test                 # 12 tests: auth, email codes, quotas, sync, billing
npm run dev
```

Endpoints: `POST /auth/register|login|refresh|verify-email|resend-verification|forgot-password|reset-password`,
`GET/PATCH /me`, `GET /vocab/topics`, `POST /vocab/generate`, `POST /sync`,
`POST /billing/google/verify`, `POST /billing/apple/verify`, `POST /billing/google/rtdn?token=…`, `POST /billing/apple/notifications`.

Email: any SMTP provider (Resend, Brevo, SES, Gmail app password). With `SMTP_HOST` empty, codes are printed to the console (dev only).
AI/Premium endpoints require a verified email.

| | Free | Premium |
|---|---|---|
| Generations / day | 3 (8 words each) | 30 (20 words each) |
| Level | B2 | B2 + C1 |
| Topics | 6 presets | any |
| Cards | word, meaning, example | + IPA, definition, collocations, translated example |
| Saved words / sync | 100, local only | unlimited, multi-device sync |

Billing: the app sends the store purchase token/transaction id; the server re-fetches the subscription from Google Play
(`subscriptionsv2`) or the App Store Server API with its own credentials and stores the result. Store notifications
(Google RTDN, Apple v2) only trigger a re-fetch, so forged notifications change nothing.
Create a subscription product with id `premium_monthly` in both stores.

## App (`app/`)

Platform folders are not committed; generate them once (this also sets the app id to `dhp.fatties.vocab`):

```bash
cd app
flutter create --org dhp.fatties --project-name vocab --platforms=android,ios,web .
flutter pub get
flutter run --dart-define=API_URL=http://10.0.2.2:3000     # Android emulator -> host machine
```

Note: in-app purchases work on Android/iOS only; the web build can sign in and generate but cannot buy.
