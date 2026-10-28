import { describe, it, expect } from 'vitest';
import { JuryDataset } from '../src/jury/types';
import { validateJuryDataset } from '../src/jury/judgments';
import { deriveBradleyTerryWeights } from '../src/jury/deriveWeights';
import { DependencyGraph } from '../src/graph/types';
import fs from 'fs';
import path from 'path';

describe('Jury Dataset and Bradley-Terry Weighting', () => {
  const graphPath = path.resolve(process.cwd(), 'data/sample-graph.json');
  const judgmentsPath = path.resolve(process.cwd(), 'data/sample-judgments.json');
  const graph: DependencyGraph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
  const juryDataset: JuryDataset = JSON.parse(fs.readFileSync(judgmentsPath, 'utf8'));

  it('validates the sample jury dataset successfully', () => {
    const val = validateJuryDataset(juryDataset, graph);
    expect(val.valid).toBe(true);
    expect(val.errors).toHaveLength(0);
    expect(val.validJudgments.length).toBe(18);
    expect(val.activeJurorSet.size).toBe(5);
    expect(val.rejectedJudgments).toHaveLength(0);
  });

  it('rejects judgments from unregistered or inactive jurors', () => {
    const alteredDataset: JuryDataset = {
      ...juryDataset,
      judgments: [
        ...juryDataset.judgments,
        {
          applicationId: 'devcon-event-app',
          juror: '0x1234567890123456789012345678901234567890',
          packageA: 'pune/qr-ticketing',
          packageB: 'indic/hindi-i18n',
          preference: 4,
          scale: 5,
          nonce: 99,
        },
      ],
    };

    const val = validateJuryDataset(alteredDataset, graph);
    expect(val.rejectedJudgments.some(r => r.reason.includes('juror is not registered'))).toBe(true);
  });

  it('rejects self-comparisons', () => {
    const alteredDataset: JuryDataset = {
      ...juryDataset,
      judgments: [
        {
          applicationId: 'devcon-event-app',
          juror: '0x9999999999999999999999999999999999999999',
          packageA: 'pune/qr-ticketing',
          packageB: 'pune/qr-ticketing',
          preference: 3,
          scale: 5,
          nonce: 100,
        },
      ],
    };

    const val = validateJuryDataset(alteredDataset, graph);
    expect(val.rejectedJudgments.some(r => r.reason.includes('self-comparison'))).toBe(true);
  });

  it('rejects duplicate judgments by the same juror for the same pair', () => {
    const alteredDataset: JuryDataset = {
      ...juryDataset,
      judgments: [
        {
          applicationId: 'devcon-event-app',
          juror: '0x9999999999999999999999999999999999999999',
          packageA: 'pune/qr-ticketing',
          packageB: 'indic/hindi-i18n',
          preference: 4,
          scale: 5,
          nonce: 1,
        },
        {
          applicationId: 'devcon-event-app',
          juror: '0x9999999999999999999999999999999999999999',
          packageA: 'indic/hindi-i18n',
          packageB: 'pune/qr-ticketing',
          preference: 2,
          scale: 5,
          nonce: 2,
        },
      ],
    };

    const val = validateJuryDataset(alteredDataset, graph);
    expect(val.rejectedJudgments.some(r => r.reason.includes('duplicate judgment'))).toBe(true);
    expect(val.validJudgments).toHaveLength(1);
  });

  it('rejects invalid preference scale values', () => {
    const alteredDataset: JuryDataset = {
      ...juryDataset,
      judgments: [
        {
          applicationId: 'devcon-event-app',
          juror: '0x9999999999999999999999999999999999999999',
          packageA: 'pune/qr-ticketing',
          packageB: 'indic/hindi-i18n',
          preference: 6 as any,
          scale: 5,
          nonce: 1,
        },
      ],
    };

    const val = validateJuryDataset(alteredDataset, graph);
    expect(val.rejectedJudgments.some(r => r.reason.includes('invalid preference'))).toBe(true);
  });

  it('derives Bradley-Terry weights deterministically and normalizes them', () => {
    const packageIds = Object.keys(graph.packages).sort();
    const weights1 = deriveBradleyTerryWeights(packageIds, juryDataset.judgments, {
      priorAlpha: 0.05,
      maxIterations: 300,
      tolerance: 1e-12,
    });
    const weights2 = deriveBradleyTerryWeights(packageIds, juryDataset.judgments, {
      priorAlpha: 0.05,
      maxIterations: 300,
      tolerance: 1e-12,
    });

    expect(weights1.iterations).toBeGreaterThan(0);
    expect(weights1.scores).toEqual(weights2.scores);

    // Sum of normalized scores should equal 1.0 within floating point precision
    const sum = Object.values(weights1.scores).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 8);

    // Every package should have a positive score and weight
    for (const pkgId of packageIds) {
      expect(weights1.scores[pkgId]).toBeGreaterThan(0);
      expect(weights1.packageDetails[pkgId].intrinsicScore).toBeGreaterThan(0);
    }
  });

  it('handles tied preferences equally when comparison is neutral', () => {
    const packages = ['pkg-a', 'pkg-b'];
    const neutralJudgments = [
      {
        applicationId: 'test-app',
        juror: '0x9999999999999999999999999999999999999999',
        packageA: 'pkg-a',
        packageB: 'pkg-b',
        preference: 3 as const, // neutral
        scale: 5,
        nonce: 1,
      },
    ];

    const weights = deriveBradleyTerryWeights(packages, neutralJudgments);
    expect(weights.scores['pkg-a']).toBeCloseTo(0.5, 5);
    expect(weights.scores['pkg-b']).toBeCloseTo(0.5, 5);
  });
});
