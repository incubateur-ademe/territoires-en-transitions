import {
  getObligationAssujettissement,
  getStatutInstruction,
  type DemandeAvisAchevement,
} from '@tet/domain/demarches';
import type { DossierInstructionLigne } from './list-dossiers-instruction.output';
import type { DossierInstructionRow } from './list-dossiers-instruction.repository';

export type ContexteLigne = {
  deposeAvis: boolean;
  achevement: readonly DemandeAvisAchevement[];
  now: Date;
};

/**
 * Une ligne du suivi, contacts exceptés : ils ne se chargent qu'une fois la
 * page connue, pour ne pas interroger un millier de collectivités dont on
 * n'affiche que la première vingtaine.
 */
export const toDossierInstructionLigne = (
  row: DossierInstructionRow,
  { deposeAvis, achevement, now }: ContexteLigne
): DossierInstructionLigne => {
  // L'obligation déclarée sur le dépôt prime : elle vient de la collectivité
  // elle-même. La règle d'assujettissement ne parle que pour celles qui n'ont
  // rien déposé, et peut donc contredire une ligne voisine — d'où la source,
  // que l'écran affiche.
  const obligation =
    row.demarcheId !== null
      ? row.obligation
      : getObligationAssujettissement({
          natureInsee: row.collectiviteNatureInsee,
          population: row.collectivitePopulation,
        });

  return {
    demarcheId: row.demarcheId,
    demandeAvisId: row.demandeAvisId,
    demarcheTitre: row.demarcheTitre,
    demarcheStatus: row.demarcheStatus,
    launchedAt: row.launchedAt,
    avisDeadlineAt: row.avisDeadlineAt,
    transmittedAt: row.transmittedAt,
    collectivite: {
      id: row.collectiviteId,
      nom: row.collectiviteNom,
      departementCode: row.collectiviteDepartementCode,
      regionCode: row.collectiviteRegionCode,
      regionLibelle: row.collectiviteRegionLibelle,
    },
    contacts: [],
    deposeAvis,
    statut: getStatutInstruction(
      {
        demarcheStatus: row.demarcheStatus,
        avisDeadlineAt: row.avisDeadlineAt,
        deposeAvis,
        nbAvisValides: row.nbAvisValides,
        nbAvisBrouillons: row.nbAvisBrouillons,
        achevement,
      },
      now
    ),
    obligation,
    obligationSource:
      obligation === null
        ? null
        : row.demarcheId !== null
        ? 'demarche'
        : 'assujettissement',
    nbAvisValides: row.nbAvisValides,
    nbAvisBrouillons: row.nbAvisBrouillons,
  };
};
