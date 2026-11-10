import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Keep the expected jobs explicit: an unexpected skip must not pass the gate.
export function getCiFailure(needs) {
  for (const [name, job] of Object.entries(needs)) {
    if (['failure', 'cancelled'].includes(job.result)) {
      return `Le job ${name} a échoué ou a été annulé.`;
    }
  }
  for (const name of ['analyze-affected', 'validate-affected-projects']) {
    if (needs[name]?.result !== 'success') {
      return `Le job obligatoire ${name} n’a pas réussi.`;
    }
  }

  const outputs = needs['analyze-affected'].outputs;
  if (outputs?.['ci-mode'] === 'deferred') {
    return 'CI complète différée : merger d’abord la PR parente. La validation complète démarrera lorsque cette PR ciblera directement la base de la stack. Pour la lancer dès maintenant, utiliser "Re-run all jobs" sur ce run.';
  }
  if (outputs?.['ci-mode'] !== 'full') {
    return 'Le mode de validation CI est absent ou invalide.';
  }

  const checks = {
    storybook: ['run-ui-storybook', 'run-app-storybook'],
    'prepare-test-db': ['run-prepare-test-db'],
    'test-db-deploy': ['run-db-deploy'],
    'test-backend-api': ['run-backend-api'],
    'test-end-to-end': ['run-e2e'],
  };
  for (const [name, flags] of Object.entries(checks)) {
    if (flags.some((flag) => !['true', 'false'].includes(outputs[flag]))) {
      return `Le scope du job ${name} est absent ou invalide.`;
    }
    if (
      flags.some((flag) => outputs[flag] === 'true') &&
      needs[name]?.result !== 'success'
    ) {
      return `Le job attendu ${name} n’a pas réussi.`;
    }
  }
  return null;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const failure = getCiFailure(JSON.parse(process.env.CI_NEEDS));
  const message =
    failure || 'Tous les checks requis du scope affecté ont réussi.';
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${message}\n`);
  console.log(message);
  process.exitCode = failure ? 1 : 0;
}
