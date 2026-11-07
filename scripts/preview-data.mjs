import { writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { rules, replay, RULE_VERSION } from '../src/lib/rules.ts';
import { compareSpot } from '../src/lib/spot.ts';
const finite = replay(
  rules('finite'),
  [0, 1, 2, 3, 4].map((seat) => ({ kind: 'win', seat, shown: true })),
).at(-1);
const spot = compareSpot();
const data = {
  version: 1,
  rulesVersion: RULE_VERSION,
  sourceRepo: 'AndyZhang666666/poker-squid-lab',
  sourceFile: 'src/lib/rules.ts',
  sourceSha256: createHash('sha256').update(readFileSync('src/lib/rules.ts')).digest('hex'),
  players: 6,
  unit: 5,
  question: { options: [5, 25, 30], answer: -finite.settlement.payouts[5] },
  comparison: spot.rows.map((r) => ({
    mode: r.mode,
    callMinusFold: r.delta,
    foldSettlement: r.foldSide,
  })),
};
writeFileSync('public/preview.json', JSON.stringify(data, null, 2) + '\n');
console.log('Generated the homepage exercise from the versioned rule engine.');
