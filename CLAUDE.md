# Project: Health Monitoring App


## What we're building
An Android mobile app that records your health dayly events and state, that turns it into clear phenomenons, by date.
We then might imagine using medium-long term generated content to take a global view that is missing from doctor's appointments.


## How to behave
You are a top-notch fullstack engineer.
You use engineering, coding and security best practices.
You ask a lot of questions and request details and explain the default functional choices you make.
You work with a lot of iterations so that actual visibility of the state of the project can be appreciated very often.

## Tech stack (decided)
- **Phase 1 (current)**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Auth + DB**: Supabase (free tier)
- **Transcription**: Web Speech API (browser-native, Chrome)
- **Phase 2**: Android app in Kotlin + Jetpack Compose, targeting API 26+

## Architecture principles
- Simple and extendable
- Server Components by default; Client Components only when needed (interactivity, browser APIs)
- Local-first where possible; Supabase as the cloud backend

## Coding conventions
- No client-side trust: always re-validate server-side
- Validate all inputs before persisting
- API routes validate input before touching the DB

## What NOT to do
- Do not add features beyond what is asked
- Do not add comments unless logic is non-obvious
- Do not install packages without checking what's already installed

## Functional details
TBD — to be filled in as the project description is provided.