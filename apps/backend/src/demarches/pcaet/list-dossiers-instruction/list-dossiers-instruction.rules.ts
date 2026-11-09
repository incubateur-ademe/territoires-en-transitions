import {
  PcaetStatutInstructionEnum,
  pcaetStatutInstructionValues,
} from '@tet/domain/demarches';
import type { ListDossiersInstructionInput } from './list-dossiers-instruction.input';
import type {
  DossierInstructionLigne,
  PerimetreDepartement,
} from './list-dossiers-instruction.output';

type Filtres = Pick<
  ListDossiersInstructionInput,
  'statuts' | 'obligations' | 'regionCodes' | 'departementCodes' | 'recherche'
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

/** Ce que les filtres d'une ligne confrontent, porteur ou sous-ligne. */
type Attributs = {
  obligation: DossierInstructionLigne['obligation'];
  regionCode: string | null;
  departementCode: string | null;
};

/**
 * Une ligne sans obligation connue — population inconnue, nature qui ne porte
 * pas de PCAET — est écartée dès qu'un filtre d'obligation est posé : elle ne
 * peut affirmer aucune des valeurs.
 */
const attributsPassent = (
  { obligation, regionCode, departementCode }: Attributs,
  { obligations, regionCodes, departementCodes }: Filtres
): boolean =>
  !(
    (filtrePose(obligations) &&
      (obligation === null || !obligations.includes(obligation))) ||
    (filtrePose(regionCodes) &&
      (regionCode === null || !regionCodes.includes(regionCode))) ||
    (filtrePose(departementCodes) &&
      (departementCode === null || !departementCodes.includes(departementCode)))
  );

const nomPasse = (nom: string, recherche: string | undefined): boolean =>
  !recherche ||
  nom.toLocaleLowerCase('fr').includes(recherche.toLocaleLowerCase('fr'));

/**
 * La ligne telle qu'elle passe les filtres, `null` si elle n'en passe aucun.
 *
 * Le dépôt d'un Supra se filtre en groupe : il reste si le porteur ou l'un de
 * ses EPCI couverts passe les filtres d'obligation, de territoire et de
 * recherche, et ne garde que les sous-lignes qui les passent. Une recherche qui
 * nomme le porteur garde toutes ses sous-lignes ; une qui nomme un EPCI ne
 * garde que lui. Le statut est celui du dépôt, et ne se juge que sur lui.
 */
export const filtrerLigne = (
  ligne: DossierInstructionLigne,
  filtres: Filtres
): DossierInstructionLigne | null => {
  if (filtrePose(filtres.statuts) && !filtres.statuts.includes(ligne.statut)) {
    return null;
  }
  const porteurNomme = nomPasse(ligne.collectivite.nom, filtres.recherche);
  const porteurPasse =
    porteurNomme &&
    attributsPassent(
      {
        obligation: ligne.obligation,
        regionCode: ligne.collectivite.regionCode,
        departementCode: ligne.collectivite.departementCode,
      },
      filtres
    );
  const collectivitesCouvertes = ligne.collectivitesCouvertes.filter(
    (couverte) =>
      attributsPassent(couverte, filtres) &&
      (porteurNomme || nomPasse(couverte.nom, filtres.recherche))
  );
  if (!porteurPasse && collectivitesCouvertes.length === 0) {
    return null;
  }
  return { ...ligne, collectivitesCouvertes };
};

/** Cette ligne passe-t-elle les filtres ? Voir `filtrerLigne`. */
export const estRetenue = (
  ligne: DossierInstructionLigne,
  filtres: Filtres
): boolean => filtrerLigne(ligne, filtres) !== null;

/** Les départements des collectivités listées, une fois chacun, par code. */
export const listerDepartements = (
  lignes: DossierInstructionLigne[]
): PerimetreDepartement[] => {
  const parCode = new Map<string, string>();
  // Les EPCI couverts aussi : une DDT filtre sur le département d'une CC que
  // porte un Supra d'ailleurs.
  for (const { departementCode, departementLibelle } of lignes.flatMap(
    (ligne) => [ligne.collectivite, ...ligne.collectivitesCouvertes]
  )) {
    if (departementCode !== null) {
      parCode.set(departementCode, departementLibelle ?? departementCode);
    }
  }
  return [...parCode]
    .map(([code, libelle]) => ({ code, libelle }))
    .sort((a, b) => a.code.localeCompare(b.code));
};

/** Le tri porte-t-il sur une donnée que seuls les pilotes apportent ? */
export const trieSurLesPilotes = (
  sort: ListDossiersInstructionInput['sort']
): boolean => sort === 'pilote';

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

  const nomPilote = (ligne: DossierInstructionLigne) =>
    ligne.pilotes[0]?.nom ?? null;

  /**
   * Une date absente passe toujours en dernier, quel que soit le sens : une
   * collectivité sans dépôt n'a pas de date de début, et la voir ouvrir un tri
   * antéchronologique n'apprendrait rien.
   */
  const parDate = (
    a: DossierInstructionLigne,
    b: DossierInstructionLigne,
    dateDe: (ligne: DossierInstructionLigne) => string | null,
    ordre: number
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
    return ordre * (new Date(dateA).getTime() - new Date(dateB).getTime());
  };

  const parEcheance = (
    a: DossierInstructionLigne,
    b: DossierInstructionLigne,
    ordre: number
  ) => parDate(a, b, (ligne) => ligne.avisDeadlineAt, ordre);

  return [...lignes].sort((a, b) => {
    if (sort === 'priorite') {
      // Les dossiers en instruction d'abord, le plus pressant en tête : c'est
      // ce que le service vient chercher. Le reste suit, transmissions les plus
      // récentes en tête.
      const enInstructionA =
        a.statut === PcaetStatutInstructionEnum.EN_INSTRUCTION;
      const enInstructionB =
        b.statut === PcaetStatutInstructionEnum.EN_INSTRUCTION;
      if (enInstructionA !== enInstructionB) {
        return enInstructionA ? -1 : 1;
      }
      return parEcheance(a, b, enInstructionA ? 1 : -1);
    }
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
    if (sort === 'pilote') {
      const nomA = nomPilote(a);
      const nomB = nomPilote(b);
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
    if (sort === 'dateLancement') {
      return parDate(a, b, (ligne) => ligne.launchedAt, sens);
    }
    if (sort === 'dateSaisine') {
      return parDate(a, b, (ligne) => ligne.dateSaisine, sens);
    }
    if (sort === 'dateAdoption') {
      return parDate(a, b, (ligne) => ligne.adoptedAt, sens);
    }
    return parEcheance(a, b, sens);
  });
};
