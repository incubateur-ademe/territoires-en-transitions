import { pcaetStatutInstructionValues } from '@tet/domain/demarches';
import type { ListDossiersInstructionInput } from './list-dossiers-instruction.input';
import type { DossierInstructionLigne } from './list-dossiers-instruction.output';

type Filtres = Pick<
  ListDossiersInstructionInput,
  'statuts' | 'obligations' | 'regionCodes' | 'recherche'
>;

/**
 * Un filtre est-il posé sur ce champ ?
 *
 * Champ absent et liste vide disent la même chose — « ne trie rien » —, et
 * c'est la seconde qui compte : « Désélectionner les options » vide la liste et
 * ne doit pas vider l'écran. Le défaut ne vient pas d'ici mais du schéma
 * d'entrée, qui ne parle que d'un champ absent.
 */
const filtrePose = <T>(
  valeurs: readonly T[] | undefined
): valeurs is readonly T[] => valeurs !== undefined && valeurs.length > 0;

/**
 * Cette ligne passe-t-elle les filtres ?
 *
 * Une ligne sans obligation connue — population inconnue, nature qui ne porte
 * pas de PCAET — est écartée dès qu'un filtre d'obligation est posé : elle ne
 * peut affirmer ni l'une ni l'autre.
 */
export const estRetenue = (
  ligne: DossierInstructionLigne,
  { statuts, obligations, regionCodes, recherche }: Filtres
): boolean => {
  if (filtrePose(statuts) && !statuts.includes(ligne.statut)) {
    return false;
  }
  if (
    filtrePose(obligations) &&
    (ligne.obligation === null || !obligations.includes(ligne.obligation))
  ) {
    return false;
  }
  if (
    filtrePose(regionCodes) &&
    (ligne.collectivite.regionCode === null ||
      !regionCodes.includes(ligne.collectivite.regionCode))
  ) {
    return false;
  }
  if (
    recherche &&
    !ligne.collectivite.nom
      .toLocaleLowerCase('fr')
      .includes(recherche.toLocaleLowerCase('fr'))
  ) {
    return false;
  }
  return true;
};

/** Le tri porte-t-il sur une donnée que seuls les contacts apportent ? */
export const trieSurLesContacts = (
  sort: ListDossiersInstructionInput['sort']
): boolean => sort === 'contact';

export const trierDossiers = (
  lignes: DossierInstructionLigne[],
  sort: ListDossiersInstructionInput['sort'],
  direction: ListDossiersInstructionInput['direction']
): DossierInstructionLigne[] => {
  const sens = direction === 'asc' ? 1 : -1;

  const parCollectivite = (
    a: DossierInstructionLigne,
    b: DossierInstructionLigne
  ) => a.collectivite.nom.localeCompare(b.collectivite.nom, 'fr');

  const nomContact = (ligne: DossierInstructionLigne) => {
    const contact = ligne.contacts[0];
    return contact ? `${contact.prenom} ${contact.nom}` : null;
  };

  /**
   * Une date absente passe toujours en dernier, quel que soit le sens : une
   * collectivité sans dépôt n'a pas de date de début, et la voir ouvrir un tri
   * antéchronologique n'apprendrait rien.
   */
  const parDate = (
    a: DossierInstructionLigne,
    b: DossierInstructionLigne,
    dateDe: (ligne: DossierInstructionLigne) => string | null
  ) => {
    const dateA = dateDe(a);
    const dateB = dateDe(b);
    if (dateA === dateB) {
      return parCollectivite(a, b);
    }
    if (dateA === null) {
      return 1;
    }
    if (dateB === null) {
      return -1;
    }
    return sens * (new Date(dateA).getTime() - new Date(dateB).getTime());
  };

  return [...lignes].sort((a, b) => {
    if (sort === 'collectivite') {
      return sens * parCollectivite(a, b);
    }
    if (sort === 'statut') {
      // Les valeurs de l'enum suivent le cycle de vie : leur rang ordonne le
      // tri de l'amont vers l'aval.
      const ecart =
        pcaetStatutInstructionValues.indexOf(a.statut) -
        pcaetStatutInstructionValues.indexOf(b.statut);
      return ecart === 0 ? parCollectivite(a, b) : sens * ecart;
    }
    if (sort === 'contact') {
      const nomA = nomContact(a);
      const nomB = nomContact(b);
      if (nomA === nomB) {
        return parCollectivite(a, b);
      }
      if (nomA === null) {
        return 1;
      }
      if (nomB === null) {
        return -1;
      }
      return sens * nomA.localeCompare(nomB, 'fr');
    }
    if (sort === 'dateDebut') {
      return parDate(a, b, (ligne) => ligne.launchedAt);
    }
    return parDate(a, b, (ligne) => ligne.avisDeadlineAt);
  });
};
