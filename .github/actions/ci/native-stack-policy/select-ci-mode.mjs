import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function selectCiMode(eventName, event, runAttempt = 1) {
  const pr = event.pull_request;
  const stack = pr?.stack;
  // A rerun is also the escape hatch for validating an upper layer immediately
  // or recovering after stack membership changes without a new push.
  if (eventName !== 'pull_request' || runAttempt > 1) return 'full';
  if (
    !Number.isInteger(stack?.number) ||
    stack.number < 1 ||
    !Number.isInteger(stack.position) ||
    !Number.isInteger(stack.size) ||
    stack.position < 1 ||
    stack.position > stack.size ||
    typeof stack.base?.ref !== 'string' ||
    !stack.base.ref ||
    typeof pr.base?.ref !== 'string' ||
    !pr.base.ref
  ) {
    return 'full';
  }
  // Positions include already merged layers: position 1 is not necessarily
  // the lowest remaining PR. The direct base determines promotion.
  return pr.base.ref === stack.base.ref ? 'full' : 'deferred';
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const mode = selectCiMode(
    process.env.GITHUB_EVENT_NAME,
    event,
    Number(process.env.GITHUB_RUN_ATTEMPT || 1),
  );
  appendFileSync(process.env.GITHUB_OUTPUT, `mode=${mode}\n`);
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    mode === 'deferred'
      ? 'CI complète différée : cette PR appartient à une stack GitHub native et dépend encore d’une PR parente. Les checks rapides restent exécutés. Le merge reste bloqué jusqu’à la validation complète.\n'
      : 'CI complète des projets affectés.\n',
  );
}
