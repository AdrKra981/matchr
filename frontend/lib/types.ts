export interface User {
    id: number;
    email: string;
}

/** What the login and register forms collect. Never persisted client-side. */
export interface Credentials {
    email: string;
    password: string;
}

export interface Explanation {
    match_score: number;
    strengths: string[];
    gaps: string[];
}

export interface Match {
    rank: number;
    score: number;
    title: string;
    company_name: string | null;
    city: string | null;
    url: string | null;
    salary_from: number | null;
    salary_to: number | null;
    salary_currency: string | null;
    explanation: Explanation | null;
}

export interface RankParams {
    topK?: number;
    what?: string;
    city?: string;
    minSalary?: number;
}

export interface CvSummary {
    filename: string;
    chars: number;
}

/** What the backend returns from POST /cv/upload. */
export interface CvUploadResult {
    id: number;
    chars: number;
    embedding_dim: number;
}

/** The four sequential backend calls behind "Find matches". */
export type PipelineStage = "fetch" | "index" | "rank" | "explain";

/** Filter form state. Kept as strings — these come straight from inputs. */
export interface FilterState {
    what: string;
    city: string;
    minSalary: string;
    topK: number;
}
