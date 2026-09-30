import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { ActionsDeReferenceView } from '@/app/shared/actions-de-reference/actions-de-reference.view';
import ActionsReferencePage from './actions-reference/page';

/**
 * Il n'existe pas de groupe `(standard)` qui rassemblerait les routes réservées
 * aux collectivités standard : la garde est posée segment par segment, par un
 * `layout.tsx` qui réexporte `StandardOnlyLayout`.
 *
 * Rien dans l'arborescence n'oblige un nouveau segment à le faire, et l'oubli
 * échoue en position *ouverte* : un service déconcentré verrait la route. Ce test
 * est donc le seul garde-fou — tout enfant direct de `[collectiviteId]` doit être
 * gardé, ou déclaré ci-dessous avec sa raison.
 *
 * Les enfants de `(acces-restreint)` n'ont rien à déclarer : le layout du groupe
 * porte la garde et les layouts sont hérités.
 */

const routesDir = import.meta.dirname;
const guardModule = 'standard-only.layout';

/** Segments volontairement hors garde standard. */
const segmentsHorsGardeStandard: Record<string, string> = {
  '(commun)': 'routes partagées par tous les contextes (gestion des membres)',
  '(instruction)': 'réservé aux services déconcentrés — porte la garde inverse',
  'actions-reference':
    'actions de référence communes à tous les contextes, service déconcentré compris',
  instruction:
    'dossier consulté par un service sur la collectivité instruite — gardé par la saisine, pas par le type de collectivité',
};

describe('garde standard des routes de collectivité', () => {
  const segments = readdirSync(routesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  test('des segments sont bien découverts', () => {
    // Sans cette assertion, un mauvais chemin rendrait le test vert à vide.
    expect(segments.length).toBeGreaterThan(0);
  });

  test.each(segments)('le segment %s est gardé', (segment) => {
    if (segment in segmentsHorsGardeStandard) return;

    let layout = '';
    try {
      layout = readFileSync(
        path.join(routesDir, segment, 'layout.tsx'),
        'utf8'
      );
    } catch {
      // layout absent : le message d'échec ci-dessous dit quoi faire
    }

    expect(
      layout,
      `Le segment « ${segment} » n'est pas gardé. Ajoute ${segment}/layout.tsx ` +
        `contenant « export { default } from '@/app/collectivites/${guardModule}'; », ` +
        `ou déclare-le dans segmentsHorsGardeStandard avec sa raison.`
    ).toContain(guardModule);
  });
});

describe('page-accessible-par-url-en-prod', () => {
  const actionsReferenceSegment = 'actions-reference';

  it('le segment actions-reference existe et délègue à la vue des actions de référence', () => {
    expect(ActionsReferencePage()).toEqual(
      createElement(ActionsDeReferenceView)
    );
  });

  it('le segment actions-reference est déclaré hors garde standard, service déconcentré compris', () => {
    const segmentFiles = readdirSync(
      path.join(routesDir, actionsReferenceSegment)
    );

    expect({
      isDeclaredOutsideStandardGuard:
        actionsReferenceSegment in segmentsHorsGardeStandard,
      hasOwnLayout: segmentFiles.includes('layout.tsx'),
    }).toEqual({
      isDeclaredOutsideStandardGuard: true,
      hasOwnLayout: false,
    });
  });
});
