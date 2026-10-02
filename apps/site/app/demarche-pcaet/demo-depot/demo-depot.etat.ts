import {
  borner,
  estEntre,
  getJalonCourant,
  getProgression,
} from '@/site/components/demo-animee/timeline';
import {
  ADOPTION,
  AVIS,
  BOUTON_ADOPTER,
  CLICS,
  CONFETTIS,
  COURRIER,
  DOCUMENTS,
  DUREE_CLIC,
  ECRANS,
  ETAPES,
  IMPORT_PROGRAMME,
  INCLUSIONS,
  SECTEURS,
  SOUS_ETAPES_ELABORATION,
  VALEURS_GES,
  VOLETS,
} from './demo-depot.scenario';

export type PhaseDepot = 'vide' | 'vol' | 'envoi' | 'depose';
export type PhaseImport = 'attente' | 'vol' | 'chargement' | 'termine';
export type StatutVolet = 'complete' | 'a-completer' | 'optionnel';
export type EtatEtape = 'faite' | 'active' | 'a-venir';

/** Temps de vol puis d'envoi d'un document déposé. */
const DUREE_VOL = 0.5;
const DUREE_ENVOI = 0.9;

const getPhaseDepot = (temps: number, instant: number): PhaseDepot => {
  if (temps < instant) return 'vide';
  if (temps < instant + DUREE_VOL) return 'vol';
  if (temps < instant + DUREE_VOL + DUREE_ENVOI) return 'envoi';
  return 'depose';
};

const getPhaseImport = (temps: number): PhaseImport => {
  if (temps < IMPORT_PROGRAMME.vol) return 'attente';
  if (temps < IMPORT_PROGRAMME.chargement) return 'vol';
  if (temps < IMPORT_PROGRAMME.termine) return 'chargement';
  return 'termine';
};

const GLYPHES = '0123456789#%&@';

/** Les chiffres « défilent » le temps de leur saisie, avant la vraie valeur. */
const brouiller = (valeur: number, graine: number, temps: number) =>
  Array.from(
    String(valeur),
    (_, index) =>
      GLYPHES[
        (graine * 7 + index * 13 + Math.floor(temps * 40)) % GLYPHES.length
      ]
  ).join('');

/** Valeurs plausibles des volets autres que GES, déterministes. */
const getValeursVolet = (indexVolet: number) =>
  indexVolet === 0
    ? VALEURS_GES
    : SECTEURS.map((_, ligne) => {
        const base = 40 + (((ligne + 3) * 131 * (indexVolet + 1)) % 900);
        return [
          base,
          Math.round(base * 0.8),
          Math.round(base * 0.55),
          Math.round(base * 0.3),
        ];
      });

const getDiagnostic = (temps: number) => {
  const indexVolet = VOLETS.reduce(
    (courant, volet, index) => (temps >= volet.ouverture ? index : courant),
    0
  );
  const volets = VOLETS.map((volet, index) => {
    const statut: StatutVolet =
      temps >= volet.completion
        ? 'complete'
        : volet.optionnel
        ? 'optionnel'
        : 'a-completer';
    return { ...volet, actif: index === indexVolet, statut };
  });

  // Le premier volet se saisit lentement, ligne par ligne ; les suivants d'un coup.
  const premierVolet = indexVolet === 0;
  const dureeSaisie = premierVolet ? 0.25 : 0.12;
  const valeurs = getValeursVolet(indexVolet);
  const lignes = SECTEURS.map((secteur, ligne) => {
    const revelation = (colonne: number) =>
      premierVolet
        ? 7.0 + ligne * 0.22 + colonne * 0.05
        : VOLETS[indexVolet].ouverture + 0.05 + ligne * 0.02 + colonne * 0.01;
    return {
      secteur,
      active: temps >= revelation(0),
      cellules: valeurs[ligne].map((valeur, colonne) => {
        const debut = revelation(colonne);
        const enSaisie = estEntre(temps, debut, debut + dureeSaisie);
        return {
          enSaisie,
          texte:
            temps >= debut + dureeSaisie
              ? String(valeur)
              : enSaisie
              ? brouiller(valeur, ligne * 4 + colonne, temps)
              : '',
        };
      }),
    };
  });

  return { volets, voletActif: volets[indexVolet], lignes };
};

const getDocuments = (temps: number) => {
  let rangInclusion = 0;
  const documents = DOCUMENTS.map((document) => {
    if (document.depot) {
      return {
        ...document,
        phase: getPhaseDepot(temps, document.depot.instant),
        progression: getProgression(
          temps,
          document.depot.instant + DUREE_VOL,
          DUREE_ENVOI
        ),
        inclus: false,
      };
    }
    const inclus = temps >= INCLUSIONS.debut + rangInclusion * INCLUSIONS.pas;
    rangInclusion += 1;
    return { ...document, phase: null, progression: 0, inclus };
  });
  const inclusions = documents.filter(({ depot }) => !depot);
  return {
    documents,
    inclusions: {
      faites: inclusions.filter(({ inclus }) => inclus).length,
      total: inclusions.length,
    },
  };
};

/** Tout ce qu'affiche la démo à l'instant de scène `temps`. */
export const getEtatDemoDepot = (temps: number) => {
  const ecran = getJalonCourant(
    ECRANS.map((item) => ({ ...item, instant: item.debut })),
    temps
  ).ecran;

  const etapes = ETAPES.map((etape) => {
    const faite = temps >= etape.fin;
    const active = !faite && temps >= etape.debut;
    const etat: EtatEtape = faite ? 'faite' : active ? 'active' : 'a-venir';
    return {
      ...etape,
      etat,
    };
  });

  const avisRecus = AVIS.map((avis) => ({
    ...avis,
    recu: temps >= avis.reception,
  }));
  const phaseImport = getPhaseImport(temps);
  const validable = temps >= IMPORT_PROGRAMME.validation;
  const adoptable = estEntre(temps, BOUTON_ADOPTER.apparition, ADOPTION);
  const adopte = temps >= ADOPTION;

  const boutonPrincipal =
    ecran === 'documents' || ecran === 'diagnostic'
      ? { libelle: 'Étape suivante', actif: true, visible: true }
      : ecran === 'programme'
      ? {
          libelle: 'Valider le dépôt pour avis',
          actif: validable,
          visible: true,
        }
      : { libelle: 'Adopter le PCAET', actif: true, visible: adoptable };

  return {
    ecran,
    clic: CLICS.some((clic) => estEntre(temps, clic, clic + DUREE_CLIC)),
    ...getDocuments(temps),
    ...getDiagnostic(temps),
    programme: {
      phaseImport,
      planRattache: phaseImport === 'termine',
      nombreActions: borner(
        Math.round(
          ((temps - IMPORT_PROGRAMME.termine) / 0.5) *
            IMPORT_PROGRAMME.nombreActions
        ),
        0,
        IMPORT_PROGRAMME.nombreActions
      ),
      verifie: temps >= IMPORT_PROGRAMME.verification,
      validable,
    },
    etapes,
    etapeCourante:
      etapes.find(({ etat }) => etat === 'active') ?? etapes[etapes.length - 1],
    enElaboration: etapes[0].etat === 'active',
    sousEtapes: SOUS_ETAPES_ELABORATION.map((sousEtape) => ({
      ...sousEtape,
      faite: temps >= sousEtape.completion,
      courante: sousEtape.ecran === ecran,
    })),
    avis: {
      titre:
        temps < ETAPES[2].debut
          ? 'Transmis pour avis'
          : temps < ADOPTION
          ? 'Consultation des avis et délibération'
          : 'Adoption',
      sousTitre:
        temps < ETAPES[2].debut
          ? 'Votre dossier a été transmis au conseil régional et au préfet de région.'
          : temps < ADOPTION
          ? 'Les avis sont arrivés. Consultez-les, puis adoptez votre plan.'
          : 'Votre plan est adopté. Place au pilotage de vos actions.',
      courrierArrive: temps >= COURRIER.arrivee,
      courrierOuvert: temps >= COURRIER.ouverture,
      rapportSortant: AVIS.find(({ sortie, reception }) =>
        estEntre(temps, sortie, reception)
      ),
      recus: avisRecus,
      adoptable,
      adopte,
    },
    boutonPrincipal,
    confettis: estEntre(temps, CONFETTIS.debut, CONFETTIS.fin),
  };
};

export type EtatDemoDepot = ReturnType<typeof getEtatDemoDepot>;
