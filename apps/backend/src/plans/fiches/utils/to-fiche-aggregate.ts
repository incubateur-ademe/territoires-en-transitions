import { ResolvedEntities } from '@/backend/plans/fiches/import/import-plan.dto';
import { FicheImport } from '@/backend/plans/fiches/import/schemas/import.schema';
import { FicheAggregate } from '@/backend/plans/fiches/services/fiche.service';

export function toFicheAggregate(
  fiche: FicheImport,
  resolvedEntities: ResolvedEntities,
  collectiviteId: number
): FicheAggregate {
  return {
    collectiviteId,
    titre: fiche.titre,
    description: fiche.description,
    objectifs: fiche.objectifs,
    cibles: fiche.cible ? [fiche.cible] : undefined,
    ressources: fiche.resources,
    financements: fiche.financements,
    budgetPrevisionnel: fiche.budget?.toString(),
    statut: fiche.status,
    priorite: fiche.priorite,
    dateDebut: fiche.dateDebut,
    dateFin: fiche.dateFin,
    ameliorationContinue: fiche.ameliorationContinue,
    calendrier: fiche.calendrier,
    notesComplementaires: fiche.notesComplementaire,
    instanceGouvernance: fiche.instanceGouvernance,
    participationCitoyenneType: fiche.participation,

    effetsAttendus: resolvedEntities.effetsAttendus,
    structures: resolvedEntities.structures,
    services: resolvedEntities.services,
    pilotes: resolvedEntities.pilotes.map((userId) => ({ userId })),
    referents: resolvedEntities.referents.map((userId) => ({ userId })),
    financeurs: fiche.financeurs.map((f, idx) => ({
      tagId: resolvedEntities.financeurs[idx],
      montant: f.montant,
    })),
  };
}
