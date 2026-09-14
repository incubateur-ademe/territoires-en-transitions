import { describe, expect, it } from 'vitest';
import { appLabels } from './catalog';
import { collectivitesLabels } from './collectivites.labels';
import { demarchesLabels } from './demarches.labels';
import { indicateursLabels } from './indicateurs.labels';
import { plansLabels } from './plans.labels';
import { referentielsLabels } from './referentiels.labels';
import { sharedLabels } from './shared.labels';
import { utilisateursAndEntityLabels } from './utilisateurs-and-entity.labels';

/**
 * Le seul piège du découpage par domaine, et il est silencieux : dans
 * `catalog.ts` les spreads passent avant les clés littérales, donc une clé
 * copiée dans son fichier de domaine mais oubliée dans `catalog.ts` continue de
 * gagner — sans erreur TypeScript ni ESLint, et avec l'ancien texte à l'écran.
 *
 * La comparaison se fait sur la valeur, références de fonctions comprises : une
 * redéfinition, même au mot près, n'est pas la même fonction.
 */
describe('appLabels n’écrase aucun libellé de domaine', () => {
  const domaines = {
    'collectivites.labels': collectivitesLabels,
    'demarches.labels': demarchesLabels,
    'indicateurs.labels': indicateursLabels,
    'plans.labels': plansLabels,
    'referentiels.labels': referentielsLabels,
    'shared.labels': sharedLabels,
    'utilisateurs-and-entity.labels': utilisateursAndEntityLabels,
  };

  it.each(Object.entries(domaines))('%s', (_nom, labels) => {
    const catalogue = appLabels as Record<string, unknown>;
    const ecrasees = Object.entries(labels).filter(
      ([cle, valeur]) => catalogue[cle] !== valeur
    );

    expect(ecrasees.map(([cle]) => cle)).toEqual([]);
  });
});

describe('aideUploadFichier', () => {
  it('accorde « Format supporté » au singulier', () => {
    // Le cas des démarches PCAET : le modèle n'autorise que le PDF.
    expect(
      appLabels.aideUploadFichier({ tailleMaxMo: 10, formats: ['pdf'] })
    ).toBe('Taille maximale par fichier : 10 Mo. Format supporté : pdf.');
  });

  it('accorde « Formats supportés » au pluriel', () => {
    expect(
      appLabels.aideUploadFichier({
        tailleMaxMo: 10,
        formats: ['pdf', 'docx'],
      })
    ).toBe(
      'Taille maximale par fichier : 10 Mo. Formats supportés : pdf, docx.'
    );
  });
});
