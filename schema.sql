DROP TABLE IF EXISTS companies;
CREATE TABLE companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  ctc_band TEXT NOT NULL,
  work_mode TEXT NOT NULL,
  original_url TEXT NOT NULL,
  healed_url TEXT NOT NULL,
  ats_platform TEXT NOT NULL,
  link_status TEXT NOT NULL DEFAULT 'VERIFIED',
  batch_number INTEGER NOT NULL DEFAULT 1,
  last_checked_at TEXT NOT NULL
);

DROP TABLE IF EXISTS jobs;
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  experience_band TEXT NOT NULL,
  location_mode TEXT NOT NULL,
  posted_date TEXT NOT NULL,
  is_rolling INTEGER NOT NULL DEFAULT 0,
  verified_url TEXT NOT NULL,
  tech_stack TEXT NOT NULL,
  match_score INTEGER NOT NULL DEFAULT 85,
  summary TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_jobs_posted ON jobs(is_rolling ASC, posted_date DESC);
CREATE INDEX idx_companies_batch ON companies(batch_number);

INSERT INTO companies (name, ctc_band, work_mode, original_url, healed_url, ats_platform, link_status, batch_number, last_checked_at) VALUES
  ('Cloudflare', '35-65 LPA', 'Hybrid (Bengaluru)', 'https://cloudflare.com/careers/india-old', 'https://job-boards.greenhouse.io/cloudflare', 'Greenhouse', 'HEALED_301', 1, '2026-10-28T12:00:00Z'),
  ('Stripe', '45-75 LPA', 'Hybrid (Bengaluru)', 'https://stripe.com/jobs/india-broken', 'https://stripe.com/jobs/search?office_locations=Asia+Pacific--Bengaluru', 'Greenhouse', 'HEALED_404', 1, '2026-10-28T12:00:00Z'),
  ('Atlassian', '40-70 LPA', 'Remote (India)', 'https://atlassian.com/company/careers/all-jobs', 'https://www.atlassian.com/company/careers/all-jobs?location=India', 'Lever', 'VERIFIED', 1, '2026-10-28T12:00:00Z'),
  ('Uber', '45-80 LPA', 'Hybrid (Bengaluru / Hyderabad)', 'https://uber.com/careers/india-2023', 'https://www.uber.com/in/en/careers/list/?location=IND-Karnataka-Bangalore', 'iCIMS / Custom', 'HEALED_404', 1, '2026-10-28T12:00:00Z'),
  ('Rubrik', '50-85 LPA', 'Hybrid (Bengaluru)', 'https://boards.greenhouse.io/rubrik-old', 'https://www.rubrik.com/company/careers/departments/engineering', 'Greenhouse', 'HEALED_404', 1, '2026-10-28T12:00:00Z'),
  ('Rippling', '45-75 LPA', 'Hybrid (Bengaluru)', 'https://jobs.lever.co/rippling-legacy', 'https://ats.rippling.com/rippling/jobs', 'Rippling ATS', 'HEALED_404', 1, '2026-10-28T12:00:00Z'),
  ('Confluent', '40-70 LPA', 'Remote (India)', 'https://jobs.lever.co/confluent', 'https://careers.confluent.io/jobs?location=India', 'Ashby / Custom', 'HEALED_301', 1, '2026-10-28T12:00:00Z'),
  ('Coinbase', '50-90 LPA', 'Remote (India)', 'https://coinbase.com/careers/positions', 'https://www.coinbase.com/en-gb/careers/positions?department=Engineering', 'Greenhouse', 'VERIFIED', 1, '2026-10-28T12:00:00Z');

INSERT INTO jobs (id, company_name, role_title, experience_band, location_mode, posted_date, is_rolling, verified_url, tech_stack, match_score, summary) VALUES
  ('cf-8212060', 'Cloudflare', 'Software Engineer (Infrastructure & Platform Tooling)', '3+ years', 'Bengaluru (Hybrid)', '2026-10-27', 0, 'https://job-boards.greenhouse.io/cloudflare/jobs/8212060?gh_jid=8212060', 'Go, Python, Rust, REST/gRPC, Terraform, CI/CD', 98, 'Internal platforms and services that automate global infrastructure provisioning, runtime ops, and reliability.'),
  ('cf-8168623', 'Cloudflare', 'Software Engineer - Platforms & Productivity', '2-5 years', 'Hybrid / Global', '2026-10-26', 0, 'https://job-boards.greenhouse.io/cloudflare/jobs/8168623?gh_jid=8168623', 'TypeScript, Go, Bash, CI/CD, GitOps, MCP, AI Agents', 97, 'Developer productivity tooling, MCP servers, internal AI agents, and Engineering Codex policy checks.'),
  ('stripe-sde2', 'Stripe', 'Software Engineer, Backend Infrastructure', '2-4 years (SWE II)', 'Bengaluru (Hybrid)', '2026-10-25', 0, 'https://stripe.com/jobs/search?office_locations=Asia+Pacific--Bengaluru', 'Java, Go, Ruby, Distributed Systems, Kafka', 92, 'Core payment routing and ledger reliability services in Bengaluru.'),
  ('uber-sde2', 'Uber', 'Software Engineer II - Core Platform', '2-4 years (SDE-2)', 'Bengaluru (Hybrid)', '2026-10-24', 0, 'https://www.uber.com/in/en/careers/list/?location=IND-Karnataka-Bangalore', 'Go, Java, Microservices, Kubernetes, gRPC', 91, 'Marketplace fulfillment and developer platform microservices.'),
  ('rippling-swe2', 'Rippling', 'Software Engineer II - Platform & Workflows', '3+ years', 'Bengaluru (Hybrid)', '2026-10-22', 0, 'https://ats.rippling.com/rippling/jobs', 'Python, TypeScript, Go, Distributed Queues', 89, 'Workflow orchestration primitives and identity graph sync engines.'),
  ('atlassian-p40', 'Atlassian', 'Software Engineer (P40 / SDE-2) - Cloud Platform', '2+ years', 'India (Remote)', '2026-10-20', 0, 'https://www.atlassian.com/company/careers/all-jobs?location=India', 'Kotlin, Java, TypeScript, AWS, Terraform', 88, 'Multi-tenant cloud reliability, deployment pipelines, and dev tooling.'),
  ('rubrik-swe2', 'Rubrik', 'Software Engineer - Distributed Systems', '2-5 years', 'Bengaluru (Hybrid)', 'Rolling Req', 1, 'https://www.rubrik.com/company/careers/departments/engineering', 'Go, C++, Python, Storage', 86, 'Distributed metadata indexing and recovery systems.');
