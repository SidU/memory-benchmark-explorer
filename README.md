# LongMemEval Human Explorer

This repo is a lightweight web app for humans to experience the kinds of questions
and context in the LongMemEval dataset. The goal is to make it easy to explore
long-context memory prompts, answer them yourself, and see how the tasks are structured.

## What it is
- A Next.js app that samples LongMemEval questions and shows their full dialogue history.
- A simple test runner with timing and a shareable result page.
- A way to understand the dataset qualitatively (not a benchmark runner).

## Getting started
1. Install dependencies:
   ```
   npm install
   ```
2. Fetch the raw dataset (requires network access):
   ```
   npm run fetch:data
   ```
3. Build the compact dataset used by the app:
   ```
   npm run build:data
   ```
4. Run the app:
   ```
   npm run dev
   ```

Open `http://localhost:3000`.

## LLM grading
Answer grading is performed on the server with OpenAI. Set `OPENAI_API_KEY`
in your environment before running the app.

## Dataset notes
- Raw files are downloaded from Hugging Face.
- The app reads from `public/data/longmemeval_s.compact.json` and
  `public/data/longmemeval_m.compact.json`.
- These compact files are derived from the raw dataset for faster loading in the browser.

Optional env vars for build:
- `LONGMEMEVAL_MAX_ITEMS`: limit the number of items when building compact datasets.
- `LONGMEMEVAL_SAMPLE_SEED`: deterministic sampling seed when limiting items.

## License
MIT, see `LICENSE`.
