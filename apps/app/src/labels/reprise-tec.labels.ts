import { plural } from '@tet/ui/labels/plural';

export const repriseTecLabels = {
  repriseTec: 'Reprise T&C',
  repriseTecDescription:
    'Vérifier, collectivité par collectivité, ce que la reprise de Territoires & Climat a amené dans TeT',
  repriseTecSousTitre:
    'Les collectivités porteuses d’un dossier PCAET dans Territoires & Climat',
  repriseTecRechercher: 'Nom, SIREN, ID TeT ou n° T&C',
  repriseTecColonneCollectiviteTec: 'Collectivité T&C',
  repriseTecColonneCollectiviteTet: 'Collectivité TeT',
  repriseTecColonneSiren: 'SIREN',
  repriseTecColonneTerritoire: 'Territoire',
  repriseTecColonnePopulation: 'Habitants',
  repriseTecIdTec: (id: number) => `n° T&C ${id}`,
  repriseTecIdTet: (id: number) => `ID TeT ${id}`,
  repriseTecIntrouvableDansTet: 'Introuvable dans TeT',
  repriseTecAucunResultat: 'Aucune collectivité ne correspond à la recherche',
  repriseTecNombreCollectivites: plural({
    zero: 'Aucune collectivité',
    one: 'collectivité',
    other: 'collectivités',
  }),
  repriseTecRecetteNonConstruite: 'La recette n’est pas encore construite',
  repriseTecRecetteNonConstruiteDescription:
    'Lancer l’étape « construire-recette » du script de reprise sur cette base, puis recharger la page.',
};
