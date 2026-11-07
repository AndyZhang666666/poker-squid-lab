import test from 'node:test';
import assert from 'node:assert/strict';
import {
  rules,
  startRound,
  applyEvent,
  replay,
  settle,
  PREFIX,
  markUnits,
} from '../src/lib/rules.ts';
import { compareSpot } from '../src/lib/spot.ts';
import { simulate } from '../src/lib/simulation.ts';
const win = (seat, shown = true) => ({ kind: 'win', seat, shown }),
  last = (a) => a.at(-1);
test('finite repeat, chops, side pots and unrevealed first wins do not award', () => {
  let s = startRound(rules('finite'));
  for (const e of [{ kind: 'chop' }, { kind: 'side-only' }, win(0, false)]) s = applyEvent(s, e);
  assert.equal(
    s.marks.reduce((a, b) => a + b),
    0,
  );
  s = applyEvent(applyEvent(s, win(0)), win(0));
  assert.equal(s.marks[0], 1);
  assert.equal(s.remaining, 4);
});
test('finite round settles 25 BB from last unmarked and conserves cents', () => {
  const s = last(
    replay(
      rules('finite'),
      [0, 1, 2, 3, 4].map((i) => win(i)),
    ),
  );
  assert.equal(s.ended, true);
  assert.deepEqual(s.settlement.payouts, [5, 5, 5, 5, 5, -25]);
  assert.equal(
    s.settlement.payouts.reduce((a, b) => a + b),
    0,
  );
  assert.strictEqual(applyEvent(s, win(5)), s);
});
test('infinite double, chop carry, first reveal and full holding multiplier', () => {
  let s = startRound(rules('infinite'));
  s = applyEvent(s, { kind: 'chop' });
  assert.equal(s.nextAward, 3);
  s = applyEvent(s, win(0, false));
  assert.equal(s.nextAward, 3);
  s = applyEvent(s, win(0));
  assert.equal(s.marks[0], 3);
  assert.equal(markUnits('infinite', 3), 6);
  s = applyEvent(s, win(0, false));
  assert.equal(s.marks[0], 4);
  assert.equal(s.nextAward, 1);
});
test('award is capped by supply and every unmarked player pays separately', () => {
  let s = last(
    replay(
      rules('infinite', 3),
      Array.from({ length: 4 }, () => win(0)),
    ),
  );
  assert.equal(s.remaining, 1);
  s = applyEvent(s, { kind: 'chop' });
  assert.equal(s.nextAward, 1);
  s = applyEvent(s, win(0));
  assert.equal(s.reason, 'supply');
  assert.deepEqual(s.settlement.payouts, [120, -60, -60]);
  assert.equal(s.settlement.transfers.length, 2);
});
test('last-unmarked endpoint does not pay unissued markers', () => {
  const s = last(replay(rules('infinite', 3), [win(0), win(0), win(1)]));
  assert.equal(s.remaining, 2);
  assert.deepEqual(s.settlement.payouts, [30, 5, -35]);
});
test('authored river uses physical cards and reproduces all three counterfactuals', () => {
  const c = compareSpot();
  assert.equal(c.equity.win, 0.25);
  assert.equal(c.equity.tie, 0);
  assert.deepEqual(
    c.rows.map((r) => r.delta),
    [-3.75, 3.75, 11.25],
  );
  assert.deepEqual(
    c.rows.map((r) => r.foldSide),
    [0, -25, -55],
  );
  assert.equal(c.rows[1].threshold, 0.2);
  assert.deepEqual(c.rows[2].marks, [3, 2, 1, 1, 0, 0]);
});
test('zero penalty agrees with plain chip EV; pot and ranges are validated', () => {
  assert.deepEqual(
    compareSpot(30, 15, 0).rows.map((r) => r.delta),
    [-3.75, -3.75, -3.75],
  );
  assert.throws(() => compareSpot(10, 15));
  assert.throws(() => rules('finite', 2));
  assert.throws(() => rules('finite', 6, 1.001));
  assert.throws(() => replay(rules('finite'), [win(9)]));
});
test('all replay prefixes are immutable and complete ledger stays zero-sum across seeded simulations', () => {
  const events = PREFIX.concat([win(5)]);
  const a = replay(rules('infinite'), events);
  assert.equal(a[0].marks[0], 0);
  assert.deepEqual(last(replay(rules('infinite'), events.slice(0, 6))).marks, a[6].marks);
  for (let n = 3; n <= 9; n++) {
    const r = simulate({
      players: n,
      unit: 0.13,
      weights: Array(n).fill(1),
      trials: 40,
      seed: n,
      chopRate: 0.2,
    });
    for (const mode of ['finite', 'infinite']) {
      assert.equal(r[mode].completed, 40);
      assert.ok(Math.abs(r[mode].seats.reduce((sum, s) => sum + s.mean, 0)) < 1e-9);
      assert.equal(
        r[mode].seats[0].distribution.reduce((sum, x) => sum + x[1], 0),
        40,
      );
    }
  }
});
test('paired simulation is reproducible and finite equal-weight averages agree with analytical checks', () => {
  const input = {
    players: 6,
    unit: 5,
    weights: Array(6).fill(1),
    trials: 5000,
    seed: 20261107,
    chopRate: 0,
  };
  const a = simulate(input),
    b = simulate(input);
  assert.deepEqual(a, b);
  assert.ok(Math.abs(a.finite.meanHands - 8.7) < 0.25);
  for (const s of a.finite.seats) assert.ok(s.interval[0] < 1 / 6 && s.interval[1] > 1 / 6);
  assert.throws(() => simulate({ ...input, weights: [0, 0] }));
});
