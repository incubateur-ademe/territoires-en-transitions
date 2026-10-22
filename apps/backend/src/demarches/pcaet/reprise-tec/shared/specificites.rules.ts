import {
  DemarchePcaetStatusEnum,
  type DemarchePcaetStatus,
} from '@tet/domain/demarches';

export type Specificite = { regles: number[]; ton: 'info' | 'warning' } & (
  | { code: 'autre_siren'; sirenTec: string; sirenTet: string }
  | { code: 'copie_fondue'; copieId: number }
  | { code: 'sans_etat' }
  | {
      code: 'elaboration_publie';
      approbationLe: string | null;
      lanceLe: string | null;
    }
  | { code: 'depot_instruit'; approbationLe: string | null }
  | { code: 'adoption_suivi'; adopteLe: string | null }
  | {
      code: 'adoption_repli';
      adopteLe: string | null;
      approbationLe: string | null;
    }
  | { code: 'lancement_corrige'; saisi: string; lanceLe: string | null }
  | {
      code: 'transmission_ramenee';
      transmisDansTec: string;
      avisEtatLe: string | null;
      transmisLe: string;
    }
  | { code: 'melange' }
  | { code: 'aucun_service' }
);

export type SpecificitesInput = {
  dossier: {
    etat: string | null;
    lanceBrut: string | null;
    receptionProjetLe: string | null;
    avisDrealLe: string | null;
    avisCrLe: string | null;
    melange: boolean;
    adoptionDecideePar: string | null;
  };
  copieId: number | null;
  sirenTec: string | null;
  sirenTet: string | null;
  suivi: { avisEtatLe: string | null; approbationLe: string | null };
  demarche: {
    status: DemarchePcaetStatus;
    launchedAt: string | null;
    transmittedAt: string | null;
    adoptedAt: string | null;
  } | null;
};

const toJour = (date: string | null) => date?.slice(0, 10) ?? null;

export const listSpecificites = ({
  dossier,
  copieId,
  sirenTec,
  sirenTet,
  suivi,
  demarche,
}: SpecificitesInput): Specificite[] => {
  const specificites: Specificite[] = [];

  if (sirenTec && sirenTet && sirenTec !== sirenTet) {
    specificites.push({
      code: 'autre_siren',
      sirenTec,
      sirenTet,
      regles: [1],
      ton: 'info',
    });
  }
  if (copieId !== null) {
    specificites.push({
      code: 'copie_fondue',
      copieId,
      regles: [1],
      ton: 'info',
    });
  }
  if (demarche === null) {
    return specificites;
  }

  if (!dossier.etat) {
    specificites.push({ code: 'sans_etat', regles: [12], ton: 'warning' });
  }
  if (
    dossier.etat === 'en_cours_elaboration' &&
    demarche.status === DemarchePcaetStatusEnum.PUBLIE
  ) {
    specificites.push({
      code: 'elaboration_publie',
      approbationLe: suivi.approbationLe,
      lanceLe: toJour(demarche.launchedAt),
      regles: [1, 2],
      ton: 'warning',
    });
  }
  if (
    dossier.etat === 'depot_pour_avis' &&
    demarche.status === DemarchePcaetStatusEnum.INSTRUIT
  ) {
    specificites.push({
      code: 'depot_instruit',
      approbationLe: suivi.approbationLe,
      regles: [1],
      ton: 'info',
    });
  }
  if (dossier.adoptionDecideePar === 'suivi') {
    specificites.push({
      code: 'adoption_suivi',
      adopteLe: demarche.adoptedAt,
      regles: [2],
      ton: 'info',
    });
  }
  if (dossier.adoptionDecideePar === 'repli') {
    specificites.push({
      code: 'adoption_repli',
      adopteLe: demarche.adoptedAt,
      approbationLe: suivi.approbationLe,
      regles: [2],
      ton: 'warning',
    });
  }
  if (dossier.lanceBrut && Number(dossier.lanceBrut.slice(0, 4)) < 2000) {
    specificites.push({
      code: 'lancement_corrige',
      saisi: dossier.lanceBrut.slice(0, 10),
      lanceLe: toJour(demarche.launchedAt),
      regles: [2],
      ton: 'warning',
    });
  }
  const transmisDansTec =
    dossier.receptionProjetLe ??
    [dossier.avisDrealLe, dossier.avisCrLe]
      .filter((date): date is string => date !== null)
      .sort()[0] ??
    null;
  const transmisLe = toJour(demarche.transmittedAt);
  if (transmisLe && transmisDansTec && transmisLe !== transmisDansTec) {
    specificites.push({
      code: 'transmission_ramenee',
      transmisDansTec,
      avisEtatLe: suivi.avisEtatLe,
      transmisLe,
      regles: [2],
      ton: 'warning',
    });
  }
  if (dossier.melange) {
    specificites.push({ code: 'melange', regles: [9], ton: 'warning' });
  }
  if (demarche.status === DemarchePcaetStatusEnum.EN_ELABORATION) {
    specificites.push({ code: 'aucun_service', regles: [4], ton: 'info' });
  }
  return specificites;
};
