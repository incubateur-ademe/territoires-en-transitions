import type { DemarchePcaet } from '@tet/domain/demarches';
import type { Specificite } from '../shared/specificites.rules';

export type RecetteDossierDetail = {
  dossier: {
    tecDossierId: number;
    nom: string | null;
    etat: string | null;
    types: number[] | null;
    publie: boolean | null;
    oblige: boolean | null;
    version: string | null;
    creeLe: string | null;
    lanceLe: string | null;
    receptionProjetLe: string | null;
    avisDrealLe: string | null;
    avisCrLe: string | null;
    depotDefinitifLe: string | null;
    misAJourLe: string | null;
    eluReferent: string | null;
    description: string | null;
    populationCouverte: number | null;
    commentaireStatut: string | null;
    motif: string | null;
    sectionDuMotif: number | null;
  };
  suivi: { avisEtatLe: string | null; approbationLe: string | null };
  copie: { tecDossierId: number; etat: string | null } | null;
  demarche: DemarchePcaet | null;
  ecarts: {
    tableSource: string;
    motif: string;
    precision: string;
    nombre: number;
    section: number;
  }[];
  specificites: Specificite[];
};
