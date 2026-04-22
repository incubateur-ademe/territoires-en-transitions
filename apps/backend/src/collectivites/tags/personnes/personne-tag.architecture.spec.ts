import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

const SERVICE_FILE = join(__dirname, 'personne-tag.service.ts');

// Méthodes du service qui interrogent `personne_tag` directement sans passer
// par la policy. Chacune doit être justifiée explicitement — voir la doc de
// la méthode concernée. Toute ajout à cette liste doit passer en revue.
const LEGACY_UNSCOPED_METHODS: ReadonlySet<string> = new Set([
  'changeTagAndDelete',
]);

function readService(): string {
  return readFileSync(SERVICE_FILE, 'utf8');
}

describe('personne-tag domain architecture', () => {
  test('service does not import PermissionService', () => {
    const content = readService();
    expect(content).not.toContain('PermissionService');
    expect(content).not.toMatch(/authorizations\/permission\.service/);
  });

  test('every `.where(...)` on personneTagTable goes through applyPolicyWhere', () => {
    const content = readService();
    const unguarded = findUnguardedPersonneTagWhereClauses(content);

    expect(
      unguarded,
      `Les appels suivants font .where(...) sur personneTagTable sans passer par applyPolicyWhere : ${unguarded.join(
        ', '
      )}. Ajoute applyPolicyWhere ou, pour une raison documentée, ajoute la méthode appelante à LEGACY_UNSCOPED_METHODS.`
    ).toEqual([]);
  });
});

// Scanne le fichier et retourne la liste des méthodes contenant un
// `.where(...)` qui mentionne `personneTagTable.` sans `applyPolicyWhere(`
// dans le bloc de la même méthode. Heuristique volontairement simple :
// si elle produit un faux positif, soit on wrappe la query, soit on ajoute
// la méthode à l'allow-list avec une doc explicite.
function findUnguardedPersonneTagWhereClauses(source: string): string[] {
  const methodPattern =
    /^(?: {2}(?:private |protected |public )?(?:async )?([a-zA-Z_][a-zA-Z0-9_]*)\s*\()/gm;
  const methods: Array<{ name: string; start: number; end: number }> = [];
  const matches = [...source.matchAll(methodPattern)];
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    methods.push({
      name: current[1],
      start: current.index ?? 0,
      end: next?.index ?? source.length,
    });
  }

  const offenders: string[] = [];
  for (const method of methods) {
    if (LEGACY_UNSCOPED_METHODS.has(method.name)) {
      continue;
    }
    const body = source.slice(method.start, method.end);
    const touchesTable = /personneTagTable\./.test(body);
    const hasWhere = /\.where\s*\(/.test(body);
    const hasPolicyHelper = /applyPolicyWhere\s*\(/.test(body);
    if (touchesTable && hasWhere && !hasPolicyHelper) {
      offenders.push(method.name);
    }
  }
  return offenders;
}
