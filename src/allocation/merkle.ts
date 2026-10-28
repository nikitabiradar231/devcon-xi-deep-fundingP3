import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { getAddress, keccak256, AbiCoder } from 'ethers';
import { PackageAllocation } from './allocate';
import { hashPackageId } from './canonicalize';

export const MERKLE_LEAF_TYPES = [
  'uint256', // distributionId
  'bytes32', // graphHash
  'bytes32', // algorithmVersionHash
  'bytes32', // packageIdHash
  'address', // recipient
  'uint256', // amountWei
];

export interface MerkleLeafData {
  distributionId: string;
  graphHash: string;
  algorithmVersionHash: string;
  packageId: string;
  packageIdHash: string;
  recipient: string;
  amountWei: string;
  proof: string[];
  leafHash: string;
}

export interface MerkleAllocationResult {
  root: string;
  distributionId: string;
  graphHash: string;
  algorithmVersionHash: string;
  leafCount: number;
  leaves: MerkleLeafData[];
  proofMap: Record<string, MerkleLeafData>; // keyed by packageId
  treeDump: unknown;
}

export function generateMerkleAllocations(
  distributionId: bigint | number,
  graphHash: string,
  algorithmVersionHash: string,
  allocations: PackageAllocation[]
): MerkleAllocationResult {
  const distIdBig = BigInt(distributionId);

  // Format leaves for StandardMerkleTree
  // Values: [distributionId, graphHash, algorithmVersionHash, packageIdHash, recipient, amountWei]
  const treeValues: [string, string, string, string, string, string][] = allocations.map(a => {
    const pkgHash = hashPackageId(a.packageId);
    const checksumAddr = getAddress(a.maintainer);
    return [
      distIdBig.toString(),
      graphHash,
      algorithmVersionHash,
      pkgHash,
      checksumAddr,
      a.amountWei,
    ];
  });

  const tree = StandardMerkleTree.of(treeValues, MERKLE_LEAF_TYPES);
  const root = tree.root;

  const leavesData: MerkleLeafData[] = [];
  const proofMap: Record<string, MerkleLeafData> = {};

  for (const [i, v] of tree.entries()) {
    const proof = tree.getProof(i);
    const alloc = allocations[i];

    // Compute standard double-hashed leaf hash matching OZ StandardMerkleTree and Solidity
    const abiCoder = AbiCoder.defaultAbiCoder();
    const encodedInner = abiCoder.encode(MERKLE_LEAF_TYPES, v);
    const innerHash = keccak256(encodedInner);
    const leafHash = keccak256(innerHash); // Double hash: keccak256(bytes.concat(keccak256(encoded)))

    const item: MerkleLeafData = {
      distributionId: v[0],
      graphHash: v[1],
      algorithmVersionHash: v[2],
      packageId: alloc.packageId,
      packageIdHash: v[3],
      recipient: v[4],
      amountWei: v[5],
      proof,
      leafHash,
    };

    leavesData.push(item);
    proofMap[alloc.packageId] = item;
  }

  return {
    root,
    distributionId: distIdBig.toString(),
    graphHash,
    algorithmVersionHash,
    leafCount: leavesData.length,
    leaves: leavesData,
    proofMap,
    treeDump: tree.dump(),
  };
}

export function verifyLeafProof(
  root: string,
  leafData: MerkleLeafData
): boolean {
  try {
    const abiCoder = AbiCoder.defaultAbiCoder();
    const leafValues = [
      leafData.distributionId,
      leafData.graphHash,
      leafData.algorithmVersionHash,
      leafData.packageIdHash,
      leafData.recipient,
      leafData.amountWei,
    ];
    const tree = StandardMerkleTree.of([leafValues], MERKLE_LEAF_TYPES);
    // Tree entries check
    return StandardMerkleTree.verify(root, MERKLE_LEAF_TYPES, leafValues, leafData.proof);
  } catch (err) {
    return false;
  }
}
