# Voice Field Guide

Voice Field Guide is a mobile-first AI travel companion. Point your phone camera
at a landmark or natural feature, choose a curiosity lens, and hear a short,
conversational explanation powered by OpenAI vision and text-to-speech.

It is an early prototype with no authentication, database, or accounts. Place
history is stored locally in the browser.

## How it works

```
Camera → identify the place → choose a lens or ask a question
       → generate an answer → synthesize speech → autoplay
```

- **`app/`** — Next.js App Router UI and API routes for identification, answers,
  transcription, and speech.
- **`components/`** — Camera, controls, place details, and exploration history.
- **`hooks/`** — Camera, geolocation, recording, local history, and interaction state.
- **`lib/`** — OpenAI integrations, prompts, modes, geocoding, and shared types.

## Experience

- Identify landmarks and natural features from a camera frame.
- Add GPS context to improve identification without treating it as proof.
- Explore through three lenses: **Why here?**, **What people miss**, and
  **How it works**.
- Ask spoken follow-up questions about the same place.
- Hear concise answers read aloud.
- Revisit device-local exploration history.

## Built with

- Next.js 15, React 19, and TypeScript
- OpenAI vision, transcription, and text-to-speech APIs
- Browser camera, microphone, and geolocation APIs
- Tailwind CSS 4

## Run locally

1. Add your key:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` and set `OPENAI_API_KEY`.

2. Start the dev server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:3000.

> **Camera note:** `getUserMedia` requires a secure context. `localhost` counts as
> secure, so desktop works. To test from your **phone**, use the Vercel URL (HTTPS) —
> a plain `http://<your-ip>:3000` will not grant camera access on mobile.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Set the `OPENAI_API_KEY` environment variable.
4. Deploy — you get an HTTPS URL, which the camera needs on mobile.

## AI models

- Identification + answers: `gpt-4o` (`lib/identify.ts`, `lib/answer.ts`)
- Transcription: `gpt-4o-mini-transcribe` (`lib/transcribe.ts`)
- Text-to-speech: `gpt-4o-mini-tts`, voice `alloy` (`lib/tts.ts`)

Swap either in one line if you want a different voice or model.

## Privacy notes

Camera frames, recorded questions, and optional coordinates are sent to the
server only to fulfill the current request. Exploration history is stored in
the browser's local storage. Never commit `.env.local` or expose your OpenAI API
key in client-side code.

## Status

Prototype. The core capture-to-conversation flow is working and the production
build passes. Future work may include stronger accessibility, automated tests,
and production privacy controls.
