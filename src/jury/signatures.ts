import { verifyTypedData, Signer, getAddress } from 'ethers';
import { PairwiseJudgment } from './types';

export const EIP712_DOMAIN_NAME = 'PayTheWells';
export const EIP712_DOMAIN_VERSION = '1';

export interface Eip712DomainConfig {
  name?: string;
  version?: string;
  chainId: number;
  verifyingContract: string;
}

export const EIP712_JUDGMENT_TYPES = {
  PairwiseJudgment: [
    { name: 'applicationId', type: 'string' },
    { name: 'graphHash', type: 'bytes32' },
    { name: 'packageA', type: 'string' },
    { name: 'packageB', type: 'string' },
    { name: 'preference', type: 'uint8' },
    { name: 'nonce', type: 'uint256' },
  ],
};

export function buildEip712Domain(config: Eip712DomainConfig) {
  return {
    name: config.name || EIP712_DOMAIN_NAME,
    version: config.version || EIP712_DOMAIN_VERSION,
    chainId: config.chainId,
    verifyingContract: getAddress(config.verifyingContract),
  };
}

export function buildEip712Value(judgment: PairwiseJudgment, graphHash: string) {
  return {
    applicationId: judgment.applicationId,
    graphHash,
    packageA: judgment.packageA,
    packageB: judgment.packageB,
    preference: judgment.preference,
    nonce: judgment.nonce,
  };
}

export function verifyJudgmentSignature(
  judgment: PairwiseJudgment,
  graphHash: string,
  domainConfig: Eip712DomainConfig
): boolean {
  if (!judgment.signature) return false;
  try {
    const domain = buildEip712Domain(domainConfig);
    const value = buildEip712Value(judgment, graphHash);
    const recovered = verifyTypedData(domain, EIP712_JUDGMENT_TYPES, value, judgment.signature);
    return getAddress(recovered) === getAddress(judgment.juror);
  } catch (err) {
    return false;
  }
}

export async function signJudgment(
  signer: Signer,
  judgment: Omit<PairwiseJudgment, 'signature'>,
  graphHash: string,
  domainConfig: Eip712DomainConfig
): Promise<PairwiseJudgment> {
  const domain = buildEip712Domain(domainConfig);
  const value = buildEip712Value(judgment as PairwiseJudgment, graphHash);
  const signature = await signer.signTypedData(domain, EIP712_JUDGMENT_TYPES, value);
  return {
    ...judgment,
    signature,
  };
}
