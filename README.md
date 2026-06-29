# EventOra - Student Society Event Management & Ticketing Platform

EventOra is a campus event platform for student societies. It helps students discover events, register or pay for tickets, store QR tickets, and check in through a mobile-friendly organiser scanner.

## Current Build

This repository contains the integrated EventOra Vue + Slim + MySQL build for the campus event lifecycle.

Included workflows:

- Event discovery landing page.
- Event listing cards with categories, price, and availability.
- Event detail and backend-backed registration checkout.
- Mock payment confirmation.
- Waitlist, cancellation, and duplicate registration prevention.
- My Tickets wallet with upcoming and past ticket cards.
- QR check-in scanner and manual fallback.
- Check-in outcomes for success, invalid ticket, wrong society, and already checked in.
- Faculty admin approval and dashboard workflows.
- Organiser dashboards, attendance CSV export, feedback, notifications, and certificates.

## Demo Flow

1. Discover upcoming events from the landing page.
2. Review event details and reserve a seat.
3. Complete the mock payment confirmation for a paid event.
4. Review waitlist, cancellation, and duplicate registration states.
5. Open My Tickets to view upcoming and past QR tickets.
6. Use the QR check-in screen to review scanner, manual fallback, and result panels.

## Run Locally

```powershell
cd backend
copy .env.example .env
& "C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe" "C:\laragon\bin\composer\composer.phar" install
& "C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe" -S localhost:8000 -t public
```

In another terminal:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Then open:

```text
http://localhost:5173
```

See `DEPLOYMENT.md` for database import, public deployment, and production environment settings.

## Android

The Capacitor Android project is in `frontend/android`.

```powershell
cd frontend
npm.cmd run build
npx.cmd cap sync android
npx.cmd cap open android
```

For emulator testing, set `VITE_API_BASE_URL` to the deployed backend URL before building.
