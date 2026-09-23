import {
  CollectiviteNatureType,
  CollectiviteSousTypeEnum,
  NATURE_TO_SOUS_TYPE,
} from '@tet/domain/collectivites';
import { LigneDemarche, LigneSuivi, Porteur } from './lecture';

type Statut = 'en_elaboration' | 'instruit' | 'publie';

type Obligation = 'obligatoire' | 'volontaire';

export type Dossier = {
  tecId: number;
  misAJourLe: string | null;
  colonnes: {
    collectiviteId: number | null;
    titre: string;
    description: string;
    status: Statut;
    obligation: Obligation;
    launchedAt: string | null;
    publishedAt: string | null;
    transmittedAt: string | null;
    avisDeadlineAt: string | null;
    adoptedAt: string | null;
    createdAt: string | null;
  };
};

/** La ligne de `demarche` à écrire pour une ligne de T&C. */
export const buildDossier = (
  ligne: LigneDemarche,
  porteur: Porteur | undefined,
  suivi: Map<string, LigneSuivi>
): Dossier => {
  const ligneSuivi = porteur?.siren ? suivi.get(porteur.siren) : undefined;
  const approbation = ligneSuivi?.approbation ?? null;
  const statut = calculateStatut(ligne, approbation);
  const dates = calculateDates(ligne, statut, approbation);

  return {
    tecId: ligne.id,
    misAJourLe: ligne.misAJourLe,
    colonnes: {
      collectiviteId: porteur?.collectiviteId ?? null,
      titre: ligne.nom,
      description: ligne.description,
      status: statut,
      obligation: calculateObligation(ligne.oblige, ligneSuivi, porteur),
      launchedAt: ligne.lanceLe,
      publishedAt: dates.publishedAt,
      transmittedAt: dates.transmittedAt,
      avisDeadlineAt: dates.avisDeadlineAt,
      adoptedAt: dates.adoptedAt,
      createdAt: ligne.creeLe,
    },
  };
};

/**
 * Règle : élaboration reste en élaboration ; mis en œuvre et sans état sont
 * publiés ; un dépôt pour avis est publié si le suivi l'approuve, instruit sinon.
 */
const calculateStatut = (
  ligne: LigneDemarche,
  approbation: string | null
): Statut => {
  if (ligne.etat === null || ligne.etat === 'mise_en_oeuvre') {
    return 'publie';
  }
  if (ligne.etat === 'en_cours_elaboration') {
    return 'en_elaboration';
  }
  if (ligne.etat === 'depot_pour_avis') {
    if (approbation === null) {
      return 'instruit';
    }
    const reference = calculateTransmission(ligne) ?? jour(ligne.creeLe);
    if (reference === null || approbation >= ajouterMois(reference, -24)) {
      return 'publie';
    }
    return 'instruit';
  }
  throw new Error(`État T&C inconnu : « ${ligne.etat} » (ligne ${ligne.id}).`);
};

/**
 * Règle : les quatre dates. Pas de transmission en élaboration, sinon la
 * clôture de nuit passerait le dossier en instruit.
 */
const calculateDates = (
  ligne: LigneDemarche,
  statut: Statut,
  approbation: string | null
) => {
  const transmittedAt =
    statut === 'en_elaboration' ? null : calculateTransmission(ligne);
  const avisDeadlineAt = transmittedAt && ajouterMois(transmittedAt, 3);

  if (statut !== 'publie') {
    return {
      transmittedAt,
      avisDeadlineAt,
      publishedAt: null,
      adoptedAt: null,
    };
  }

  const publishedAt = calculatePublishedAt(ligne, approbation);
  const adoptedAt = calculateAdoptedAt(ligne, approbation, publishedAt);
  return { transmittedAt, avisDeadlineAt, publishedAt, adoptedAt };
};

/** La plus tardive des deux saisines, sinon la réception du projet. */
const calculateTransmission = (ligne: LigneDemarche) => {
  const envois = [jour(ligne.envoiDreal), jour(ligne.envoiCr)].filter(
    (d): d is string => d !== null
  );
  if (envois.length > 0) {
    return envois.reduce((a, b) => (a > b ? a : b));
  }
  return jour(ligne.receptionProjet);
};

/** Le dépôt définitif, l'approbation du suivi, ou la dernière mise à jour. */
const calculatePublishedAt = (
  ligne: LigneDemarche,
  approbation: string | null
) => {
  if (ligne.etat === 'mise_en_oeuvre') {
    return ligne.deposeLe;
  }
  if (ligne.etat === 'depot_pour_avis') {
    return approbation;
  }
  const creation = jour(ligne.creeLe);
  if (approbation !== null && creation !== null && approbation > creation) {
    return approbation;
  }
  return ligne.misAJourLe ?? ligne.creeLe;
};

/** L'approbation du suivi si elle ne suit pas le dépôt définitif, sinon la publication. */
const calculateAdoptedAt = (
  ligne: LigneDemarche,
  approbation: string | null,
  publishedAt: string | null
) => {
  const depot = jour(ligne.deposeLe);
  if (
    ligne.etat === 'mise_en_oeuvre' &&
    approbation !== null &&
    depot !== null &&
    approbation <= depot
  ) {
    return approbation;
  }
  return jour(publishedAt);
};

/**
 * Règle : la déclaration du dossier, sinon le suivi ADEME, sinon le seuil de
 * 20 000 habitants pour une intercommunalité, sinon volontaire.
 */
const calculateObligation = (
  oblige: boolean | null,
  suivi: LigneSuivi | undefined,
  porteur: Pick<Porteur, 'natureInsee' | 'population'> | undefined
): Obligation => {
  if (oblige !== null) {
    return oblige ? 'obligatoire' : 'volontaire';
  }

  if (suivi !== undefined) {
    const valeur = suivi.obligation.trim();
    const estUneDate = /^\d{4}-\d{2}-\d{2}$/.test(valeur);
    return estUneDate || valeur === 'Obligé' ? 'obligatoire' : 'volontaire';
  }

  const sousType = porteur?.natureInsee
    ? NATURE_TO_SOUS_TYPE[porteur.natureInsee as CollectiviteNatureType]
    : null;
  const estEpciFiscalitePropre = sousType === CollectiviteSousTypeEnum.EPCI_FP;
  const depasseLeSeuil = (porteur?.population ?? 0) > 20000;
  return estEpciFiscalitePropre && depasseLeSeuil
    ? 'obligatoire'
    : 'volontaire';
};

/** « 2021-03-15 09:12:00+00 » donne « 2021-03-15 ». */
const jour = (horodatage: string | null) =>
  horodatage === null ? null : horodatage.slice(0, 10);

/** Ajoute des mois à un jour (31 janvier + 1 mois = 28 février). */
const ajouterMois = (j: string, mois: number) => {
  const [annee, moisSource, jourSource] = j.split('-').map(Number);
  const cible = new Date(Date.UTC(annee, moisSource - 1 + mois, 1));
  const dernierJour = new Date(
    Date.UTC(cible.getUTCFullYear(), cible.getUTCMonth() + 1, 0)
  ).getUTCDate();
  cible.setUTCDate(Math.min(jourSource, dernierJour));
  return cible.toISOString().slice(0, 10);
};
