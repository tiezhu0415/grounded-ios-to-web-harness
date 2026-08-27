import assert from 'node:assert/strict';
import test from 'node:test';
import { createStateSnapshots, validateStateSnapshots } from '../scripts/state_snapshots.mjs';
import { createVisualMatrix } from '../scripts/visual_matrix.mjs';

function fixture() {
  const coverage = {
    project: 'generic-app',
    screens: [{
      id: 'Views/DetailView.swift#DetailView', declaration: 'DetailView', route: '/detail',
      states: [{ id: 'detail-populated', label: 'Populated detail' }],
    }],
  };
  const matrix = createVisualMatrix(coverage);
  matrix.screens[0].critical = true;
  matrix.screens[0].selection_reason = 'DATA_DENSE';
  matrix.screens[0].states[0].required = true;
  const snapshots = createStateSnapshots(coverage, matrix);
  return { coverage, matrix, snapshots };
}

function confirm(snapshot) {
  snapshot.status = 'CONFIRMED';
  snapshot.confidence = 'SUPPORTED';
  snapshot.identity = { record_id: 'source-record-42', selected_variant: 'blue' };
  snapshot.source_evidence = ['RUNTIME:detail-populated'];
  snapshot.ios_setup.evidence = ['RUNTIME:detail-populated'];
  snapshot.web_setup.seed_evidence = ['SOURCE:Fixtures/detail-populated.json'];
}

test('critical iOS and Web evidence must share one confirmed state identity', () => {
  const value = fixture();
  let errors = validateStateSnapshots({ ...value, requireConfirmed: true });
  assert.ok(errors.some((error) => error.includes('not CONFIRMED')));
  confirm(value.snapshots.snapshots[0]);
  errors = validateStateSnapshots({ ...value, requireConfirmed: true });
  assert.deepEqual(errors, []);
});

test('placeholder state identity cannot become comparison evidence', () => {
  const value = fixture();
  confirm(value.snapshots.snapshots[0]);
  value.snapshots.snapshots[0].identity = { record_id: 'TBD' };
  const errors = validateStateSnapshots({ ...value, requireConfirmed: true });
  assert.ok(errors.some((error) => error.includes('placeholder content')));
});

test('state snapshot contract contains no project-specific business names', () => {
  const value = fixture();
  assert.doesNotMatch(JSON.stringify(value.snapshots), /cart|checkout|favorite|ecommerce/i);
});
