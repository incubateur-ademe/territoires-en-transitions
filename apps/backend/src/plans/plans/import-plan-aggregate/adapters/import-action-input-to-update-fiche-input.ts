import { UpdateFicheInput } from '@tet/backend/plans/fiches/update-fiche/update-fiche.input';
import { isParticipationCitoyenne } from '@tet/domain/plans';
import { ResolvedFicheEntities } from '../resolvers/resolve-entity.service';
import { ImportActionOrSousAction } from '../schemas/import-action.input';
/**
 * Adapter: ImportAction → UpdateFicheInput
 *
 * Transforms import-specific data structures to domain objects.
 *
 * @param action - The imported action data from Excel
 * @param resolvedEntities - The resolved entities (tags, users, etc.)
 * @param collectiviteId - The collectivité ID
 * @returns A UpdateFicheInput ready for persistence
 */
export function importActionInputToUpdateFicheInput(
  action: ImportActionOrSousAction,
  resolvedEntities: ResolvedFicheEntities,
  collectiviteId: number
): UpdateFicheInput {
  return {
    collectiviteId,
    titre: action.titre,
    description: action.description,
    objectifs: action.objectifs,
    cibles: action.cible ? [action.cible] : undefined,
    ressources: action.resources,
    financements: action.financements,
    budgetPrevisionnel: action.budget?.toString() ?? null,
    statut: action.status,
    priorite: action.priorite,
    dateDebut: action.dateDebut?.toISOString() ?? null,
    dateFin: action.dateFin?.toISOString() ?? null,
    instanceGouvernance: resolvedEntities.instanceGouvernance,
    participationCitoyenne: isParticipationCitoyenne(action.participation ?? '')
      ? action.participation
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
