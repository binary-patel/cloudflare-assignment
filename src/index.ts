import { Env, CompanyTarget } from './types';
import { JobHunterAgentDO } from './agent-do';
import { JobScanWorkflow } from './workflow';

export { JobHunterAgentDO, JobScanWorkflow };

const SEED_BATCH: CompanyTarget[] = [
  { name: 'Cloudflare', ctcBand: '35-65 LPA', workMode: 'Hybrid (Bengaluru)', originalUrl: 'https://cloudflare.com/careers/india-old', healedUrl: 'https://job-boards.greenhouse.io/cloudflare', atsPlatform: 'Greenhouse', linkStatus: 'HEALED_301', batchNumber: 1 },
  { name: 'Stripe', ctcBand: '45-75 LPA', workMode: 'Hybrid (Bengaluru)', originalUrl: 'https://stripe.com/jobs/india-broken', healedUrl: 'https://stripe.com/jobs/search?office_locations=Asia+Pacific--Bengaluru', atsPlatform: 'Greenhouse', linkStatus: 'HEALED_404', batchNumber: 1 },
  { name: 'Uber', ctcBand: '45-80 LPA', workMode: 'Hybrid (Bengaluru)', originalUrl: 'https://uber.com/careers/india-2023', healedUrl: 'https://www.uber.com/in/en/careers/list/?location=IND-Karnataka-Bangalore', atsPlatform: 'iCIMS / Custom', linkStatus: 'HEALED_404', batchNumber: 1 },
  { name: 'Atlassian', ctcBand: '40-70 LPA', workMode: 'Remote (India)', originalUrl: 'https://www.atlassian.com/company/careers/all-jobs?location=India', healedUrl: 'https://www.atlassian.com/company/careers/all-jobs?location=India', atsPlatform: 'Lever', linkStatus: 'VERIFIED', batchNumber: 1 },
  { name: 'Rubrik', ctcBand: '50-85 LPA', workMode: 'Hybrid (Bengaluru)', originalUrl: 'https://boards.greenhouse.io/rubrik-old', healedUrl: 'https://www.rubrik.com/company/careers/departments/engineering', atsPlatform: 'Greenhouse', linkStatus: 'HEALED_404', batchNumber: 1 },
  { name: 'Rippling', ctcBand: '45-75 LPA', workMode: 'Hybrid (Bengaluru)', originalUrl: 'https://jobs.lever.co/rippling-legacy', healedUrl: 'https://ats.rippling.com/rippling/jobs', atsPlatform: 'Rippling ATS', linkStatus: 'HEALED_404', batchNumber: 1 },
];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function getAgentStub(env: Env, sessionId = 'default-session') {
  const id = env.JOB_HUNTER_AGENT.idFromName(sessionId);
  return env.JOB_HUNTER_AGENT.get(id);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);

    try {
      if (url.pathname === '/api/jobs' && request.method === 'GET') {
        const [jobs, companies] = await Promise.all([
          env.JOBS_DB.prepare(`SELECT * FROM jobs ORDER BY is_rolling ASC, posted_date DESC`).all(),
          env.JOBS_DB.prepare(`SELECT * FROM companies ORDER BY batch_number ASC, name ASC`).all(),
        ]);
        return Response.json({ jobs: jobs.results || [], companies: companies.results || [] }, { headers: CORS });
      }

      if (url.pathname === '/api/chat' && request.method === 'POST') {
        const body = (await request.json()) as { sessionId?: string; message: string };
        let jobsContext: unknown[] = [];
        try {
          const rows = await env.JOBS_DB.prepare(
            `SELECT id, company_name, role_title, experience_band, location_mode, posted_date, verified_url, tech_stack, match_score
             FROM jobs ORDER BY is_rolling ASC, posted_date DESC LIMIT 15`
          ).all();
          jobsContext = rows.results || [];
        } catch {}

        const stub = getAgentStub(env, body.sessionId);
        const resp = await stub.fetch('https://do.internal/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: body.message, jobsContext }),
        });
        return Response.json(await resp.json(), { headers: CORS });
      }

      if (url.pathname === '/api/state' && request.method === 'GET') {
        const stub = getAgentStub(env, url.searchParams.get('sessionId') || undefined);
        const resp = await stub.fetch('https://do.internal/state');
        return Response.json(await resp.json(), { headers: CORS });
      }

      if (url.pathname === '/api/shortlist' && request.method === 'POST') {
        const body = (await request.json()) as { sessionId?: string; jobId: string; notes?: string };
        const stub = getAgentStub(env, body.sessionId);
        const resp = await stub.fetch('https://do.internal/shortlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        return Response.json(await resp.json(), { headers: CORS });
      }

      if (url.pathname === '/api/workflow/trigger' && request.method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as {
          batchNumber?: number;
          sessionId?: string;
          companies?: CompanyTarget[];
        };
        const batchNumber = body.batchNumber || 1;
        const companies = body.companies?.length ? body.companies : SEED_BATCH;

        const instance = await env.JOB_SCAN_WORKFLOW.create({
          id: `batch-${batchNumber}-${Date.now()}`,
          params: {
            batchNumber,
            sessionId: body.sessionId || 'default-session',
            companies,
            candidateProfile: {
              yoe: 3,
              skills: ['Go', 'TypeScript', 'Python', 'Rust', 'Terraform', 'Kubernetes', 'CI/CD', 'MCP'],
              preferredLocations: ['Bengaluru', 'Remote India'],
            },
          },
        });

        return Response.json(
          { workflowInstanceId: instance.id, status: 'RUNNING', batchNumber, companiesQueued: companies.length },
          { headers: CORS }
        );
      }

      return env.ASSETS.fetch(request);
    } catch (err: any) {
      return Response.json({ error: err?.message || 'Worker error' }, { status: 500, headers: CORS });
    }
  },
};
