# Memory Benchmark Explorer

This repo is a lightweight web app for humans to experience long-context memory benchmarks
like LongMemEval and LoCoMo. The goal is to make it easy to explore their prompts and
dialogue history, answer them yourself, and see how the tasks are structured.

<img width="3248" height="2006" alt="image" src="https://github.com/user-attachments/assets/29b707a6-3690-49d4-b0b6-2416b7b0dcdf" />

## What it is
- A Next.js app that samples benchmark questions and shows their full dialogue history.
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

Grading is client-triggered and not tamper-proof; share links encode scores on the client only.

## Dataset notes
- Raw files are downloaded from Hugging Face.
- The app reads from `public/data/longmemeval_s.compact.json`,
  `public/data/longmemeval_m.compact.json`, and `public/data/locomo.compact.json` (LoCoMo‑MC10).
- These compact files are derived from the raw dataset for faster loading in the browser.

Optional env vars for build:
- `LONGMEMEVAL_MAX_ITEMS`: limit the number of items when building compact datasets.
- `LONGMEMEVAL_SAMPLE_SEED`: deterministic sampling seed when limiting items.
- `ALLOW_DATA_FETCH`, `FORCE_DATA_FETCH`: control dataset download behavior (used in `npm run fetch:data`).
- `LOCOMO_DATA_BASE`: override the LoCoMo source base URL (defaults to the Hugging Face Percena/locomo-mc10 dataset).

Licenses:
- LongMemEval: see upstream dataset license.
- LoCoMo‑MC10: CC-BY-NC-4.0 (non-commercial use; attribution required).

## License
MIT, see `LICENSE`.
