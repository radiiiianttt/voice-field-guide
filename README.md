# Voice Field Guide

Voice Field Guide is a mobile-first, voice-first travel companion that helps
people understand the places in front of them without leaving the moment to
search.

Point your camera at a glacier, cathedral, bridge, waterfall, or piece of
infrastructure. The app combines vision, location, language, and speech to turn
what you see into a natural conversation.

## Overview

I love traveling, but I don't love searching.

Standing in front of an unfamiliar place, curiosity usually means leaving the
moment: unlocking a phone, opening a browser, and reading through search
results. I wanted to explore a different interaction:

> What if learning about a place felt like talking to someone standing beside
> you?

I spent a few days designing and building a guide that brings vision, location,
and speech together in one conversational experience.

## The experience

Point the camera at something in the natural or built world. The app identifies
what you are looking at, then lets you explore it through three reusable lenses:

- **Why here?** — history, geography, and context
- **What people miss** — overlooked design details and visual clues
- **How it works** — engineering, geology, materials, and construction

From there, ask follow-up questions by voice without navigating away from the
camera experience. Answers are concise, conversational, and read aloud.

```text
Camera + location → identify the place → choose a lens or ask a question
                  → generate an answer → synthesize speech → continue talking
```

Explored places are saved privately on the device so they can be revisited
later.

## Building the system

The central challenge was making several AI and browser capabilities behave
like one coherent product.

| Layer | Role |
| --- | --- |
| Camera + vision | Recognizes what the user is looking at |
| GPS + OpenStreetMap | Grounds identification in geographic context |
| Language model | Generates an explanation for the selected lens |
| Speech-to-text | Turns a spoken follow-up into a question |
| Text-to-speech | Reads the answer aloud |
| Local storage | Keeps a private history of explored places |

The interaction is coordinated as one continuous session: the captured image
and place identity stay fixed, while conversation history helps follow-up
answers avoid reintroducing the place or repeating earlier details.

## Key product decisions

### Ground the AI in location

Vision models can recognize famous landmarks well, but ordinary lakes,
mountain peaks, and natural features are harder. GPS coordinates are
reverse-geocoded through OpenStreetMap and supplied as context, improving place
identification without treating location as absolute proof.

### Prefer uncertainty to hallucination

When confidence is low, the assistant says so. Prompts explicitly discourage
invented names and facts, and location is treated as a clue that must plausibly
agree with the image. Trust was more important than sounding intelligent.

### Design one interaction across many domains

Rather than create separate experiences for architecture, infrastructure, and
nature, the same three conversational lenses work across all of them. This
gives very different subjects a consistent interaction model.

### Keep explored places private and available

Places should not disappear when a conversation ends. The app keeps a
device-local history with no account or database, allowing people to revisit
what they learned while keeping the prototype lightweight.

## Outcome

- Designed and shipped end-to-end, from concept and interaction model to code
- Built a voice-first multimodal flow using vision, location, language, and
  speech APIs
- Tested the interaction in real environments in the Swiss Alps and Paris
- Supported natural landscapes and human-made structures with one shared model
- Kept the architecture lightweight: no accounts or application database

## Key learnings

Building AI products feels like designing conversations between systems. The
hardest questions were not only which models to use, but where certainty should
come from, when the assistant should speak, and how several asynchronous steps
could feel like one coherent interaction.

## Next steps

- **Reduce latency** so conversations feel faster and more responsive
- **Improve place understanding** for smaller landmarks, details, and natural
  features
- **Personalize explanations** around each person's interests and level of
  curiosity
- **Strengthen production readiness** with accessibility work, automated tests,
  and clearer privacy controls

## Tech stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · OpenAI vision and language
models · Speech-to-text · Text-to-speech · OpenStreetMap · Vercel

## Project structure

- **`app/`** — Next.js App Router UI and API routes for identification, answers,
  transcription, and speech
- **`components/`** — Camera, controls, place details, and exploration history
- **`hooks/`** — Camera, geolocation, recording, local history, and interaction
  state
- **`lib/`** — OpenAI integrations, prompts, modes, geocoding, and shared types

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your local environment file:

   ```bash
   cp .env.example .env.local
   ```

   Add your `OPENAI_API_KEY` to `.env.local`.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

> Camera access requires a secure context. `localhost` works on desktop. For
> testing on a phone, use an HTTPS deployment rather than a plain local-network
> URL.

## Deploy to Vercel

1. Import this repository into Vercel.
2. Add `OPENAI_API_KEY` as an environment variable.
3. Deploy to receive the HTTPS URL required for mobile camera access.

## AI models

- Identification and answers: `gpt-4o`
- Transcription: `gpt-4o-mini-transcribe`
- Text-to-speech: `gpt-4o-mini-tts`, using the `alloy` voice

## Privacy

Camera frames, recorded questions, and optional coordinates are sent to the
server only to fulfill a request. Exploration history remains in the browser's
local storage. The project does not use accounts or an application database.
Never commit `.env.local` or expose an OpenAI API key in client-side code.

## Status

Working prototype. The core capture-to-conversation flow is complete and the
production build passes.

## License

[MIT](LICENSE)
