import crypto from 'node:crypto';

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

export function sha256Json(value) {
  return crypto.createHash('sha256').update(JSON.stringify(stableValue(value))).digest('hex');
}

export function sourceFactsPayload(facts) {
  const { lock, locked_at, ...payload } = facts;
  return payload;
}

export function visualPlanPayload(matrix) {
  return {
    version: matrix.version,
    project: matrix.project,
    policy: {
      mode: matrix.quality_policy?.mode,
      refinement_round_limit: matrix.quality_policy?.refinement_round_limit,
      metrics_are_experimental: matrix.quality_policy?.metrics_are_experimental,
    },
    screens: (matrix.screens || []).map((screen) => ({
      source_id: screen.source_id,
      route: screen.route,
      critical: screen.critical === true,
      selection_reason: screen.selection_reason || '',
      states: (screen.states || []).map((state) => ({
        id: state.id,
        required: state.required === true,
        ios_flow: state.ios_flow,
        ios_screenshot: state.ios_screenshot,
        web_test: state.web_test,
        web_screenshot: state.web_screenshot,
        report: state.report,
        ios_crop: state.ios_crop || '',
        web_crop: state.web_crop || '',
        source_evidence: state.source_evidence || [],
      })),
    })),
  };
}

export const CONFIDENCE_LEVELS = new Set(['CONFIRMED', 'SUPPORTED', 'INFERRED', 'BLOCKED']);
export const CRITICAL_REASONS = new Set([
  'TOP_LEVEL_NAV',
  'CORE_FLOW',
  'DATA_DENSE',
  'STATEFUL',
  'FORM_OR_MUTATION',
  'UNIQUE_LAYOUT',
  'HIGH_INITIAL_DIFF',
]);
