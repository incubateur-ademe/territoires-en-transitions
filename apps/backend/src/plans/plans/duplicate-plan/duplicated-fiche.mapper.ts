import { FicheCreate, FicheWithRelations } from '@tet/domain/plans';
import { UpdateFicheInput } from '../../fiches/update-fiche/update-fiche.input';

export type AxeIdRemapping = ReadonlyMap<number, number>;

type DuplicableFicheFields = Pick<
  UpdateFicheInput,
  | 'axes'
  | 'thematiques'
  | 'sousThematiques'
  | 'effetsAttendus'
  | 'partenaires'
  | 'structures'
  | 'services'
  | 'libreTags'
  | 'instanceGouvernance'
  | 'mesures'
  | 'indicateurs'
  | 'pilotes'
  | 'referents'
  | 'financeurs'
  | 'tempsDeMiseEnOeuvre'
  | 'actionsImpact'
>;

const remapAxes = (
  axes: FicheWithRelations['axes'],
  axeIdRemapping: AxeIdRemapping
): { id: number }[] =>
  (axes ?? [])
    .map((axe) => axeIdRemapping.get(axe.id))
    .filter((id): id is number => id !== undefined)
    .map((id) => ({ id }));

export function mapSourceFicheToDuplicate({
  source,
  collectiviteId,
  parentId,
  axeIdRemapping,
}: {
  source: FicheWithRelations;
  collectiviteId: number;
  parentId: number | null;
  axeIdRemapping: AxeIdRemapping;
}): { fiche: FicheCreate; ficheFields: DuplicableFicheFields } {
  const fiche: FicheCreate = {
    collectiviteId,
    parentId,
    titre: source.titre,
    description: source.description,
    piliersEci: source.piliersEci,
    objectifs: source.objectifs,
    cibles: source.cibles,
    ressources: source.ressources,
    financements: source.financements,
    budgetPrevisionnel: source.budgetPrevisionnel,
    statut: source.statut,
    priorite: source.priorite,
    dateDebut: source.dateDebut,
    dateFin: source.dateFin,
    ameliorationContinue: source.ameliorationContinue,
    participationCitoyenne: source.participationCitoyenne,
    participationCitoyenneType: source.participationCitoyenneType,
    majTermine: source.majTermine,
    restreint: source.restreint,
  };

  const ficheFields: DuplicableFicheFields = {
    axes: remapAxes(source.axes, axeIdRemapping),
    thematiques: source.thematiques?.map((thematique) => ({
      id: thematique.id,
    })),
    sousThematiques: source.sousThematiques?.map((sousThematique) => ({
      id: sousThematique.id,
    })),
    effetsAttendus: source.effetsAttendus?.map((effet) => ({ id: effet.id })),
    partenaires: source.partenaires?.map((partenaire) => ({
      id: partenaire.id,
    })),
    structures: source.structures?.map((structure) => ({ id: structure.id })),
    services: source.services?.map((service) => ({ id: service.id })),
    libreTags: source.libreTags?.map((tag) => ({ id: tag.id })),
    instanceGouvernance: source.instanceGouvernance?.map((tag) => ({
      id: tag.id,
    })),
    mesures: source.mesures?.map((mesure) => ({ id: mesure.id })),
    indicateurs: source.indicateurs?.map((indicateur) => ({
      id: indicateur.id,
    })),
    pilotes: source.pilotes?.map((pilote) => ({
      tagId: pilote.tagId,
      userId: pilote.userId,
    })),
    referents: source.referents?.map((referent) => ({
      tagId: referent.tagId,
      userId: referent.userId,
    })),
    financeurs: source.financeurs?.map((financeur) => ({
      financeurTag: { id: financeur.financeurTagId },
      montantTtc: financeur.montantTtc,
    })),
    tempsDeMiseEnOeuvre: source.tempsDeMiseEnOeuvre
      ? { id: source.tempsDeMiseEnOeuvre.id }
      : null,
    actionsImpact:
      source.actionImpactId !== null && source.actionImpactId !== undefined
        ? [{ id: source.actionImpactId }]
        : undefined,
  };

  return { fiche, ficheFields };
}
