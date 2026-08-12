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