import { UpdateFicheInput } from '@tet/backend/plans/fiches/update-fiche/update-fiche.input';
import { isParticipationCitoyenne } from '@tet/domain/plans';
import { ResolvedFicheEntities } from '../resolvers/resolve-entity.service';
import { ImportFicheInput } from '../schemas/import-fiche.input';
/**
 * Adapter: FicheImport → UpdateFicheRequest
 *
 * Transforms import-specific data structures to domain objects.
 *
 * @param fiche - The imported fiche data from Excel
 * @param resolvedEntities - The resolved entities (tags, users, etc.)
 * @param collectiviteId - The collectivité ID
 * @returns A UpdateFicheRequest ready for persistence
 */
export function importFicheInputToUpdateFicheInput(
  fiche: ImportFicheInput,
  resolvedEntities: ResolvedFicheEntities,
  collectiviteId: number
): UpdateFicheInput {
  return {
    collectiviteId,
    titre: fiche.titre,
    description: fiche.description,
    objectifs: fiche.objectifs,
    cibles: fiche.cible ? [fiche.cible] : undefined,
    ressources: fiche.resources,
    financements: fiche.financements,
    budgetPrevisionnel: fiche.budget?.toString() ?? null,
    statut: fiche.status,
    priorite: fiche.priorite,
    dateDebut: fiche.dateDebut?.toISOString() ?? null,
    dateFin: fiche.dateFin?.toISOString() ?? null,
    calendrier: fiche.calendrier,
    instanceGouvernance: fiche.instanceGouvernance,
    participationCitoyenne: isParticipationCitoyenne(fiche.participation ?? '')
      ? fiche.participation
      : null,
    structures: resolvedEntities.structures,
    pilotes: resolvedEntities.pilotes,
    referents: resolvedEntities.referents,
    services: resolvedEntities.services,
    financeurs: resolvedEntities.financeurs.map((financeur) => ({
      financeurTag: { id: financeur.id, nom: financeur.nom },
      montantTtc: financeur.montant,
    })),
    partenaires: resolvedEntities.partenaires,
  };
}
