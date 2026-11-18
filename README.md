# Voice Field Guide

**Turning real-world exploration into a conversation.**

Voice Field Guide is a mobile-first, multimodal AI companion for understanding the places in front of you. Point a camera at a landmark, landscape, or everyday structure; identify it using visual and geographic context; then explore it through spoken explanations and follow-up questions.

**[Read the case study](https://portfolio-v2-gray-six.vercel.app/work/voice-field-guide)**

*Independent project · Product design & development · 2026*

<p align="center">
  <img
    src="https://github.com/user-attachments/assets/5e4182f2-8e9d-4747-ab8b-2e101592db38"
    width="300"
    alt="Voice Field Guide app interface"
  />
</p>

*An identified place stays in context while the user changes perspectives or asks another question.*

## The product question

**How can an AI guide understand what someone is looking at and turn that context into a natural, reliable conversation?**

Discovering a place often means interrupting the experience to search for it. I built this prototype to explore a different interaction: look at something interesting, receive a relevant explanation, and keep asking questions without switching contexts.

## Try the experience

1. **Point and capture.** Aim at a natural feature, building, sculpture, or other structure. The app requests camera access and can optionally use device location.
2. **Identify.** A vision model interprets the captured frame, with geographic context when available. The interface shows a place name or a cautious description when the exact identity is uncertain.
3. **Choose a perspective.** Explore the place through **Why here?** (history and geography), **What people miss** (overlooked details), or **How it works** (engineering, materials, or natural processes).
4. **Continue by voice.** Ask a spoken follow-up. The app transcribes the question, generates a contextual answer, and reads it aloud.
5. **Revisit.** Previously explored places and their text answers are saved in browser-local history.

The same three perspectives work across natural environments and built structures. A single captured image remains the reference for the conversation; the app retains its identified place and previous answers as the interaction continues.

## How it works

```mermaid
flowchart TD
    C["Capture a camera frame"] --> I["Identify the place"]
    G["Optional GPS"] --> O["OpenStreetMap context"]
    O --> I
    I --> D{"Explore"}
    D --> M["Choose a perspective"]
    D --> V["Ask a spoken question"]
    V --> STT["Transcribe speech"]
    M --> A["Generate a contextual answer"]
    STT --> A
    C --> A
    O --> A
    A --> TTS["Synthesize speech"]
    TTS --> P["Play response"]
    P --> D
    A --> H["Save text history locally"]
```

The frontend coordinates the experience through `useCompanion`. Next.js API routes handle identification (`/api/identify`), responses (`/api/ask`), transcription (`/api/transcribe`), and speech generation (`/api/speak`). OpenAI API credentials stay server-side.

| Component | Responsibility |
| --- | --- |
| Camera and image input | Capture the scene for identification and subsequent answers |
| GPS and OpenStreetMap | Supply optional geographic clues about nearby places |
| Vision and language model | Identify the subject and generate explanations |
| Speech-to-text and text-to-speech | Enable spoken questions and audio responses |
| Client-side session state | Preserve the original subject and conversational context |
| Browser local storage | Save explored places, answer text, and optional coordinates without an account |

### Design and engineering decisions

**Treat location as evidence, not certainty.** GPS can help distinguish similar-looking landscapes. The prompts instruct the model to name a specific place only when visual and geographic evidence plausibly agree. This is a design safeguard, not a measured accuracy guarantee.

**Keep the conversation anchored.** The captured image, identified place, and previous answers are reused for follow-ups. The interaction is designed to avoid repeatedly introducing the same subject.

**Use one exploration model across domains.** Rather than separate flows for architecture, geology, and infrastructure, the three perspectives provide a consistent interaction across subjects.

**Keep persistence lightweight.** The prototype has no account system or application database. Explored places are stored in the current browser; clearing its local data removes that saved history.

## Current scope and limitations

The core camera-to-identification-to-spoken-answer flow is implemented. The application is a working research prototype, not a production travel guide.

- **Recognition is probabilistic.** Prompt instructions encourage uncertainty but do not provide verified confidence estimates or guarantee factual accuracy.
- **Response time varies.** The interaction depends on multiple model requests, geographic services, and audio synthesis.
- **Validation is limited.** The repository does not contain a formal accuracy benchmark, automated test suite, or broad usability study.
- **Privacy is prototype-level.** Camera images, audio questions, and optional location information pass through server routes and relevant external providers to fulfill requests. Saved place history (including coordinates if available) stays in the browser's local storage.

Next steps are improving landmark identification, reducing conversational latency, testing with more travelers, and expanding accessibility and privacy controls.

## Run locally

**Requirements:** Node.js 20+ and npm; an OpenAI API key.

```bash
git clone https://github.com/radiiiianttt/voice-field-guide.git
cd voice-field-guide
npm ci
cp .env.example .env.local
```

Add your key to `.env.local`:

```dotenv
OPENAI_API_KEY=your_api_key_here
```

Start the application:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Camera and microphone permissions are required for the full experience. On a phone, use an **HTTPS** deployment: a plain local-network HTTP URL will generally not provide the secure context required for camera access.

The server-side implementation uses `gpt-4o` for image identification and answers, `gpt-4o-mini-transcribe` for transcription, and `gpt-4o-mini-tts` for audio playback.

## Project map

| Path | Purpose |
| --- | --- |
| [`app/api/`](app/api/) | Server-side identification, answer, transcription, and speech endpoints |
| [`components/`](components/) | Camera interface, place panel, voice UI, and history |
| [`hooks/`](hooks/) | Camera, microphone, location, session orchestration, and local history |
| [`lib/`](lib/) | Prompts, OpenAI integration, geocoding, modes, and shared types |

**Stack:** Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · OpenAI APIs · OpenStreetMap · Vercel

## License

[MIT](LICENSE)
