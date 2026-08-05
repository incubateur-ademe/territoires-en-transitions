// Génère le diagramme mermaid d'un workflow du domaine (make workflow-graph).
// Les workflows sont découverts par convention de nommage : tout fichier
// packages/domain/src/**/*.workflow.ts exportant une instance `createWorkflow`.
import { existsSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import prompts from 'prompts';

const DOMAIN_SRC = 'packages/domain/src';
const DOMAIN_DIST = 'packages/domain/dist';

type Workflow = {
  initialStatus: string;
  transitionNames: readonly string[];
  getTransitionDef: (transition: string) => {
    from: readonly string[];
    to: string;
    guards?: readonly string[];
  };
};

const isWorkflow = (value: unknown): value is Workflow =>
  typeof value === 'object' &&
  value !== null &&
  Array.isArray((value as Workflow).transitionNames) &&
  typeof (value as Workflow).getTransitionDef === 'function' &&
  typeof (value as Workflow).initialStatus === 'string';

function findWorkflowFiles(dir: string, fileList: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      findWorkflowFiles(fullPath, fileList);
    } else if (entry.name.endsWith('.workflow.ts')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function toMermaid(name: string, workflow: Workflow): string {
  const lines = ['stateDiagram-v2', `  [*] --> ${workflow.initialStatus}`];
  for (const transition of workflow.transitionNames) {
    const def = workflow.getTransitionDef(transition);
    const guards = def.guards?.length ? ` 🔒${def.guards.join(', ')}` : '';
    for (const from of def.from) {
      lines.push(`  ${from} --> ${def.to}: ${transition}${guards}`);
    }
  }
  return [`%% ${name}`, ...lines].join('\n');
}

const sourceFiles = findWorkflowFiles(DOMAIN_SRC);
if (sourceFiles.length === 0) {
  console.error(`Aucun fichier *.workflow.ts trouvé sous ${DOMAIN_SRC}.`);
  process.exit(1);
}

// Les workflows sont importés depuis le build du domaine (dist) : Node ne
// sait pas charger les .ts du package directement.
const candidates = sourceFiles.map((sourcePath) => {
  const distPath = join(
    DOMAIN_DIST,
    relative(DOMAIN_SRC, sourcePath).replace(/\.ts$/, '.js')
  );
  return { sourcePath, distPath };
});

// La fraîcheur du build est garantie par le target make (tsc --build) ; les
// mtimes ne sont pas fiables (cache nx, rebase).
const missing = candidates.filter(({ distPath }) => !existsSync(distPath));
if (missing.length > 0) {
  console.error(
    'Build du domaine absent pour :\n' +
      missing.map(({ sourcePath }) => `  - ${sourcePath}`).join('\n') +
      '\n→ lancez `make workflow-graph` (ou `pnpm tsc --build packages/domain/tsconfig.lib.json`).'
  );
  process.exit(1);
}

type Choice = { title: string; value: { name: string; workflow: Workflow } };
const choices: Choice[] = [];
for (const { sourcePath, distPath } of candidates) {
  const module: Record<string, unknown> = await import(
    pathToFileURL(distPath).href
  );
  for (const [exportName, value] of Object.entries(module)) {
    if (isWorkflow(value)) {
      choices.push({
        title: `${exportName} — ${relative(DOMAIN_SRC, sourcePath)}`,
        value: { name: exportName, workflow: value },
      });
    }
  }
}

if (choices.length === 0) {
  console.error(
    'Aucune instance de workflow (createWorkflow) exportée par les fichiers *.workflow.ts.'
  );
  process.exit(1);
}

let selected = choices[0].value;
if (choices.length > 1) {
  const response = await prompts({
    type: 'select',
    name: 'selected',
    message: 'Quel workflow ?',
    choices,
  });
  if (!response.selected) {
    process.exit(0);
  }
  selected = response.selected;
} else {
  console.error(`Un seul workflow actif : ${choices[0].title}\n`);
}

console.log('```mermaid');
console.log(toMermaid(selected.name, selected.workflow));
console.log('```');
