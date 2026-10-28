export interface Env {
  AI: Ai;
  JOB_HUNTER_AGENT: DurableObjectNamespace;
  JOB_SCAN_WORKFLOW: Workflow;
  JOBS_DB: D1Database;
  ASSETS: Fetcher;
}

export interface CompanyTarget {
  name: string;
  ctcBand: string;
  workMode: string;
  originalUrl: string;
  healedUrl?: string;
  atsPlatform?: string;
  linkStatus?: 'VERIFIED' | 'HEALED_404' | 'HEALED_301' | 'DEAD';
  batchNumber: number;
}

export interface SweJobOpening {
  id: string;
  companyName: string;
  roleTitle: string;
  experienceBand: string;
  locationMode: string;
  postedDate: string;
  isRolling: boolean;
  verifiedUrl: string;
  techStack: string;
  matchScore: number;
  summary: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface WorkflowPayload {
  batchNumber: number;
  sessionId: string;
  companies: CompanyTarget[];
  candidateProfile: {
    yoe: number;
    skills: string[];
    preferredLocations: string[];
  };
}
