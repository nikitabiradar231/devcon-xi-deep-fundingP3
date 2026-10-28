import { getAddress, isAddress } from 'ethers';
import { DependencyGraph } from '../graph/types';
import { JuryDataset, PairwiseJudgment, RegisteredJuror } from './types';
import { Eip712DomainConfig, verifyJudgmentSignature } from './signatures';

export interface JudgmentValidationResult {
  valid: boolean;
  errors: string[];
  validJudgments: PairwiseJudgment[];
  rejectedJudgments: { judgment: PairwiseJudgment; reason: string }[];
  activeJurorSet: Set<string>;
}

export function validateJuryDataset(
  dataset: JuryDataset,
  graph: DependencyGraph,
  options: {
    domainConfig?: Eip712DomainConfig;
    requireSignatures?: boolean;
  } = {}
): JudgmentValidationResult {
  const errors: string[] = [];
  const validJudgments: PairwiseJudgment[] = [];
  const rejectedJudgments: { judgment: PairwiseJudgment; reason: string }[] = [];

  if (!dataset.applicationId || dataset.applicationId !== graph.applicationId) {
    errors.push(`Dataset applicationId '${dataset.applicationId}' does not match graph applicationId '${graph.applicationId}'`);
  }

  // Build active juror map
  const activeJurorMap = new Map<string, RegisteredJuror>();
  for (const j of dataset.jurors || []) {
    if (!j.address || !isAddress(j.address)) {
      errors.push(`Invalid juror address '${j.address}'`);
      continue;
    }
    const normalized = getAddress(j.address);
    if (j.active) {
      activeJurorMap.set(normalized, j);
    }
  }

  if (activeJurorMap.size === 0) {
    errors.push('No active registered jurors in dataset');
  }

  // Deduplicate and validate judgments: 1 vote per juror per unordered pair
  const seenJurorPairs = new Set<string>();

  for (const [idx, judgment] of (dataset.judgments || []).entries()) {
    const logPrefix = `Judgment #${idx} (${judgment.juror})`;

    if (!judgment.juror || !isAddress(judgment.juror)) {
      rejectedJudgments.push({ judgment, reason: `${logPrefix}: invalid juror address` });
      continue;
    }

    const jurorAddress = getAddress(judgment.juror);
    if (!activeJurorMap.has(jurorAddress)) {
      rejectedJudgments.push({ judgment, reason: `${logPrefix}: juror is not registered or inactive` });
      continue;
    }

    if (!judgment.packageA || !judgment.packageB) {
      rejectedJudgments.push({ judgment, reason: `${logPrefix}: missing packageA or packageB` });
      continue;
    }

    if (judgment.packageA === judgment.packageB) {
      rejectedJudgments.push({ judgment, reason: `${logPrefix}: self-comparison (${judgment.packageA} == ${judgment.packageB})` });
      continue;
    }

    if (!graph.packages[judgment.packageA]) {
      rejectedJudgments.push({ judgment, reason: `${logPrefix}: packageA '${judgment.packageA}' not in graph` });
      continue;
    }

    if (!graph.packages[judgment.packageB]) {
      rejectedJudgments.push({ judgment, reason: `${logPrefix}: packageB '${judgment.packageB}' not in graph` });
      continue;
    }

    if (![1, 2, 3, 4, 5].includes(judgment.preference)) {
      rejectedJudgments.push({ judgment, reason: `${logPrefix}: invalid preference '${judgment.preference}'. Must be 1..5` });
      continue;
    }

    // Unordered pair key: sort alphabetically
    const pairKey = [judgment.packageA, judgment.packageB].sort().join('::');
    const jurorPairKey = `${jurorAddress}::${pairKey}`;

    if (seenJurorPairs.has(jurorPairKey)) {
      rejectedJudgments.push({ judgment, reason: `${logPrefix}: duplicate judgment for pair '${pairKey}' by same juror` });
      continue;
    }
    seenJurorPairs.add(jurorPairKey);

    // Optional or required EIP-712 signature verification
    if (options.requireSignatures || judgment.signature) {
      if (!options.domainConfig) {
        errors.push('Signature check requested but domainConfig was not provided');
      } else {
        const sigValid = verifyJudgmentSignature(judgment, dataset.graphHash, options.domainConfig);
        if (!sigValid) {
          rejectedJudgments.push({ judgment, reason: `${logPrefix}: invalid EIP-712 signature` });
          continue;
        }
      }
    }

    validJudgments.push({
      ...judgment,
      juror: jurorAddress,
    });
  }

  const activeJurorSet = new Set(activeJurorMap.keys());

  return {
    valid: errors.length === 0 && validJudgments.length > 0,
    errors,
    validJudgments,
    rejectedJudgments,
    activeJurorSet,
  };
}
