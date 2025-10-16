import { FicheWithRelationsCreation } from '@/backend/plans/fiches/domain/fiche.types';
import { ResolvedFicheEntities } from '@/backend/plans/fiches/import/resolvers/entity-resolver.service';
import { FicheImport } from '@/backend/plans/fiches/import/schemas/fiche-import.schema';
/**
 * Adapter: FicheImport → FicheWithRelations
 *
 * Transforms import-specific data structures to domain objects.
 * This is a pure function with no side effects, making it easily testable.
 *
 * @param fiche - The imported fiche data from Excel
 * @param resolvedEntities - The resolved entities (tags, users, etc.)
 * @param collectiviteId - The collectivité ID
 * @returns A FicheWithRelations ready for persistence
 */
export function toFicheWithRelations(
  fiche: FicheImport,
  resolvedEntities: ResolvedFicheEntities,
  collectiviteId: number
): FicheWithRelationsCreation {
  return {
    collectiviteId,
    titre: fiche.titre,
    description: fiche.description,
    objectifs: fiche.objectifs,
    cibles: fiche.cible ? [fiche.cible] : undefined,
    ressources: fiche.resources,
    financements: fiche.financements,
    budgetPrevisionnel: fiche.budget,
    statut: fiche.status,
    priorite: fiche.priorite,
    dateDebut: fiche.dateDebut,
    dateFin: fiche.dateFin,
    calendrier: fiche.calendrier,
    notesComplementaires: fiche.notesComplementaire,
    instanceGouvernance: fiche.instanceGouvernance,
    participationCitoyenneType: fiche.participation,
    structures: resolvedEntities.structures,
    pilotes: resolvedEntities.pilotes,
    referents: resolvedEntities.referents,
    services: resolvedEntities.services,
    financeurs: resolvedEntities.financeurs,
    partenaires: resolvedEntities.partenaires,
  };
}
