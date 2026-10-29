# StudyPilot

StudyPilot turns study materials into revision notes, quizzes, flashcards, and AI tutor answers. This Artificial Intelligence case study was created by Mani Pavan (24BCE2519).

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/manipavan916/case-study)

## Requirements

- Node.js 20 or newer
- A Gemini API key for AI features

## Set up

1. Copy `server/.env.example` to `server/.env` and add your Gemini API key. Optionally add a Groq API key to enable automatic fallback if Gemini fails.
2. Copy `client/.env.example` to `client/.env` if the API will not be running at `http://localhost:5000/api`.
3. From the project root, run `npm install`, `npm install --prefix server`, and `npm install --prefix client`.
4. Run `npm run dev` and open the Vite URL shown in the terminal (normally `http://localhost:5173`).

The API health endpoint is available at `http://localhost:5000/api/health`.

## Deploy on Render

The root `render.yaml` configures a single Node web service that serves both the built website and the API. To deploy:

1. Push this repository to GitHub.
2. In Render, choose **New > Blueprint** and connect `manipavan916/case-study`.
3. Set the `GEMINI_API_KEY` secret when prompted, then create the service. Render builds and deploys the app at its `onrender.com` address.

The free web service may sleep after 15 minutes without traffic and can take about a minute to wake when opened again. Keep the Gemini key in Render's environment settings; never add it to GitHub or a `VITE_` variable.

## Available scripts

- `npm run dev` starts the API and frontend together.
- `npm run dev:server` starts only the API.
- `npm run dev:client` starts only the frontend.
- `npm run build` creates the production frontend build in `client/dist`.
- `npm start` starts the API.

Keep local API credentials in `server/.env`. If Gemini fails and `GROQ_API_KEY` is configured, the API automatically retries the request through Groq (`GROQ_MODEL` defaults to `openai/gpt-oss-120b`). Never put provider keys in a `VITE_` variable; values with that prefix are bundled into browser code.
