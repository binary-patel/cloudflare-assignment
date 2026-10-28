
<h1>Working URL: https://cf-ai-swe-job-hunter.shubhamdp2012.workers.dev/</h1>


# cf_ai_swe_job_hunter

An edge-hosted SWE job scanner and broken ATS link repair tool built on Cloudflare Workers, Workflows, Durable Objects, D1, and Workers AI (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`).

Built for the Cloudflare Software Engineer application assignment:
- [Software Engineer - Infrastructure (#8212060)](https://job-boards.greenhouse.io/cloudflare/jobs/8212060?gh_jid=8212060)
- [Software Engineer - Platforms & Productivity (#8168623)](https://job-boards.greenhouse.io/cloudflare/jobs/8168623?gh_jid=8168623)

## Problem

Community compensation directories (like `high-paying-companies.netlify.app`) have two recurring issues when you are job hunting for mid-level (`2-4 YOE` / `SDE-2`) roles:
1. Companies frequently switch ATS providers (Greenhouse, Lever, Ashby, Workday), so a third of the links 404 or redirect to generic homepages.
2. Scraping 200+ boards sequentially times out in standard serverless functions, and keyword filters mix in 0-1 YOE new grad or 8+ YOE staff roles alongside undated evergreen requisitions.

## How it works on Cloudflare

- **Workers AI (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`)**: Parses job listings into structured JSON, filters for the 2-4 YOE band, normalizes posting dates, and handles multi-turn chat questions about role fit.
- **Workflows (`src/workflow.ts`)**: `JobScanWorkflow` splits each 20-company batch into retryable `step.do()` stages (`heal-urls`, `extract-roles`, `save-batch`) with a `step.sleep()` cooldown between ATS probes and LLM calls.
- **Durable Objects (`src/agent-do.ts`)**: `JobHunterAgentDO` uses SQLite storage (`ctx.storage.sql`) to keep per-session chat history, candidate profile skills, current batch cursor, and shortlisted job IDs.
- **D1 (`schema.sql`)**: Stores verified company ATS URLs and discovered openings indexed by `is_rolling ASC, posted_date DESC` so dated roles appear newest-first and rolling reqs stay at the bottom.
- **Static Assets (`public/index.html`)**: Single-page UI with batch workflow controls, ATS link tester, chat + Web Speech API voice input, and DO SQLite state viewer.

## Running locally

```bash
npm install
npm run db:local
npm run dev
```

Open `http://localhost:8787`. Workers AI calls require `npx wrangler login` so Wrangler can proxy inference to Cloudflare's network.

## Deploying

```bash
npx wrangler d1 create swe_jobs_db
# copy the returned database_id into wrangler.jsonc
npm run db:remote
npm run deploy
```
