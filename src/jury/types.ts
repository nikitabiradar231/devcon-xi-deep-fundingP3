export type PairwisePreference = 1 | 2 | 3 | 4 | 5;

export interface PairwiseJudgment {
  applicationId: string;
  juror: string;      // Ethereum address of registered juror
  packageA: string;   // First package id
  packageB: string;   // Second package id
  preference: PairwisePreference; // 1 (A << B), 2 (A < B), 3 (A == B), 4 (A > B), 5 (A >> B)
  scale: number;      // 5
  nonce: number;
  signature?: string; // Hex string EIP-712 signature (0x...)
}

export interface RegisteredJuror {
  address: string;
  name: string;
  active: boolean;
  registeredAt?: number;
}

export interface JuryDataset {
  applicationId: string;
  graphHash: string;
  jurors: RegisteredJuror[];
  judgments: PairwiseJudgment[];
}

export interface PackageWeightResult {
  packageId: string;
  intrinsicScore: number; // Raw Bradley-Terry score
  normalizedScore: number; // Normalized to sum to 1 across packages
  comparisonsCount: number;
  wins: number;
  losses: number;
  ties: number;
}

export interface JuryWeightOutput {
  algorithmVersion: string;
  scores: Record<string, number>; // Normalized Bradley-Terry scores
  packageDetails: Record<string, PackageWeightResult>;
  totalJudgments: number;
  validJudgmentsCount: number;
  iterations: number;
}
