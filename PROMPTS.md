# Prompt History (`PROMPTS.md`)

Submitted per the Cloudflare application instructions: *"Note: AI-assisted coding is encouraged, but you have to submit prompt history."*

## Development prompts used

1. **Initial architecture & bindings setup**
   > "I am applying to cloudflare and they are asking to build a AI project, could you create one similar to the job search thing we have done in another chat but using cloudflare's resources?
   > Job: https://job-boards.greenhouse.io/cloudflare/jobs/8212060?gh_jid=8212060 https://job-boards.greenhouse.io/cloudflare/jobs/8168623?gh_jid=8168623"

2. **Workflow & ATS link healing logic**
   > "Set up a Cloudflare Workflow (`JobScanWorkflow`) that takes a batch of companies, checks if their career URL 404s, probes Greenhouse (`job-boards.greenhouse.io/<slug>`), Lever (`jobs.lever.co/<slug>`), and Ashby (`jobs.ashbyhq.com/<slug>`) to repair dead links, and then runs `@cf/meta/llama-3.3-70b-instruct-fp8-fast` to extract 2-4 YOE SWE II roles sorted newest first with rolling reqs at the end."

3. **Durable Object SQLite session state**
   > "Use SQLite-backed Durable Objects (`ctx.storage.sql`) in `JobHunterAgentDO` to store `chat_history`, `agent_state` (batch counter + candidate profile), and `shortlisted_jobs` without needing an external Redis store."

4. **Code cleanup pass**
   > "make sure code you wrote is like a humanly written code, not AI generated, so keep the functionality working and make it like non-AI code."

## Runtime prompts used in Workers AI (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`)

### Role extraction prompt (`src/workflow.ts`)
```text
Extract active SWE II / SDE-2 roles for a candidate with 3 YOE.
Skills: Go, TypeScript, Python, Rust, Terraform, Kubernetes, CI/CD, MCP.
Target experience: 2+, 3+, 2-4, or 2-5 years. Skip 0-1 yr new grad and 8+ yr staff roles.
Respond ONLY with a JSON object: { roleTitle, experienceBand, locationMode, postedDate, isRolling, techStack, matchScore, summary }.
```

### Chat assistant system prompt (`src/agent-do.ts`)
```text
You are an assistant helping a 3-YOE software engineer filter 2-4 YOE roles and prepare applications.
Skills: Go, TypeScript, Python, Rust, Terraform, Kubernetes, CI/CD, Workers AI, Durable Objects, MCP.
Target Cloudflare openings:
- Req #8212060 (Bengaluru Hybrid): Infrastructure & Platform Tooling (Go, Python, Rust, REST/gRPC, Terraform, reliability).
- Req #8168623 (Hybrid): Platforms & Productivity (TypeScript, Go, CI/CD, GitOps, MCP servers, AI agents, Engineering Codex).
Keep answers direct, practical, and specific.
```
