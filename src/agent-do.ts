import { DurableObject } from 'cloudflare:workers';
import { Env, ChatMessage } from './types';

const LLAMA_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

export class JobHunterAgentDO extends DurableObject<Env> {
  private sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.initTables();
  }

  private initTables() {
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS agent_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS shortlisted_jobs (
        job_id TEXT PRIMARY KEY,
        notes TEXT,
        added_at TEXT NOT NULL
      );
    `);

    const batch = this.sql.exec(`SELECT value FROM agent_state WHERE key = 'current_batch'`).toArray();
    if (batch.length === 0) {
      this.sql.exec(`INSERT INTO agent_state (key, value) VALUES ('current_batch', '1')`);
      this.sql.exec(
        `INSERT INTO agent_state (key, value) VALUES ('candidate_profile', ?1)`,
        JSON.stringify({
          name: 'Candidate SWE',
          yoe: 3,
          targetBand: '2-4 YOE (SWE II / SDE-2)',
          skills: ['Go', 'TypeScript', 'Python', 'Rust', 'Terraform', 'Kubernetes', 'CI/CD', 'Workers AI', 'Durable Objects', 'MCP'],
          locations: ['Bengaluru (Hybrid)', 'India (Remote)'],
          targetReqs: ['Cloudflare #8212060 (Infra SWE)', 'Cloudflare #8168623 (Platforms & Productivity SWE)'],
        })
      );
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/state' && request.method === 'GET') {
      return Response.json(this.snapshot());
    }

    if (url.pathname === '/shortlist' && request.method === 'POST') {
      const { jobId, notes } = (await request.json()) as { jobId: string; notes?: string };
      this.sql.exec(
        `INSERT INTO shortlisted_jobs (job_id, notes, added_at) VALUES (?1, ?2, datetime('now'))
         ON CONFLICT(job_id) DO UPDATE SET notes = excluded.notes`,
        jobId,
        notes || ''
      );
      return Response.json({ ok: true, shortlisted: this.getShortlist() });
    }

    if (url.pathname === '/workflow-complete' && request.method === 'POST') {
      const data = (await request.json()) as {
        batchNumber: number;
        companiesChecked: number;
        healedCount: number;
        jobsFound: number;
      };
      this.sql.exec(
        `INSERT INTO agent_state (key, value) VALUES ('current_batch', ?1)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        String(data.batchNumber + 1)
      );
      this.logMsg(
        'assistant',
        `Batch #${data.batchNumber} finished: checked ${data.companiesChecked} companies, fixed ${data.healedCount} broken ATS URLs, added ${data.jobsFound} roles.`
      );
      return Response.json({ ok: true });
    }

    if (url.pathname === '/chat' && request.method === 'POST') {
      const { message, jobsContext } = (await request.json()) as { message: string; jobsContext?: unknown[] };
      this.logMsg('user', message);

      const history = this.getHistory(10);
      const profile = this.getProfile();

      const sysPrompt = [
        `You are an assistant helping a ${profile.yoe}-YOE software engineer filter 2-4 YOE roles and prepare applications.`,
        `Skills: ${profile.skills.join(', ')}.`,
        `Target Cloudflare openings:`,
        `- Req #8212060 (Bengaluru Hybrid): Infrastructure & Platform Tooling (Go, Python, Rust, REST/gRPC, Terraform, reliability).`,
        `- Req #8168623 (Hybrid): Platforms & Productivity (TypeScript, Go, CI/CD, GitOps, MCP servers, AI agents, Engineering Codex).`,
        `Current tracked jobs: ${JSON.stringify(jobsContext || [])}.`,
        `Keep answers direct, practical, and specific.`
      ].join('\n');

      let reply = '';
      try {
        const res = (await this.env.AI.run(LLAMA_MODEL as any, {
          messages: [
            { role: 'system', content: sysPrompt },
            ...history.map(m => ({ role: m.role, content: m.content })),
          ],
          temperature: 0.2,
          max_tokens: 600,
        })) as { response?: string };

        reply = res?.response || 'No output from model.';
      } catch {
        reply = `Saved "${message}" in Durable Object state. Connect Workers AI binding via 'npx wrangler dev --remote' to run Llama 3.3 inference.`;
      }

      this.logMsg('assistant', reply);
      return Response.json({ reply, state: this.snapshot() });
    }

    if (url.pathname === '/reset' && request.method === 'POST') {
      this.sql.exec(`DELETE FROM chat_history; DELETE FROM shortlisted_jobs;`);
      return Response.json({ ok: true, state: this.snapshot() });
    }

    return new Response('Not Found', { status: 404 });
  }

  private logMsg(role: 'user' | 'assistant' | 'system', content: string) {
    this.sql.exec(
      `INSERT INTO chat_history (role, content, timestamp) VALUES (?1, ?2, ?3)`,
      role,
      content,
      new Date().toISOString()
    );
  }

  private getHistory(limit: number): ChatMessage[] {
    const rows = this.sql
      .exec(`SELECT role, content, timestamp FROM chat_history ORDER BY id DESC LIMIT ?1`, limit)
      .toArray();
    return rows.reverse().map(r => ({
      role: String(r.role) as ChatMessage['role'],
      content: String(r.content),
      timestamp: String(r.timestamp),
    }));
  }

  private getProfile() {
    const rows = this.sql.exec(`SELECT value FROM agent_state WHERE key = 'candidate_profile'`).toArray();
    if (rows.length > 0) {
      try {
        return JSON.parse(String(rows[0].value));
      } catch {}
    }
    return {
      name: 'Candidate SWE',
      yoe: 3,
      targetBand: '2-4 YOE',
      skills: ['Go', 'TypeScript', 'Python', 'Terraform', 'CI/CD'],
      locations: ['Bengaluru (Hybrid)'],
    };
  }

  private getShortlist() {
    return this.sql.exec(`SELECT job_id, notes, added_at FROM shortlisted_jobs ORDER BY added_at DESC`).toArray();
  }

  private snapshot() {
    const b = this.sql.exec(`SELECT value FROM agent_state WHERE key = 'current_batch'`).toArray();
    return {
      currentBatch: b.length > 0 ? Number(b[0].value) : 1,
      profile: this.getProfile(),
      shortlistedJobs: this.getShortlist(),
      chatHistory: this.getHistory(25),
    };
  }
}
