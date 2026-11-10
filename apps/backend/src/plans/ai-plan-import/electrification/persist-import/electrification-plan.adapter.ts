import {
  AggregateFiche,
  CreatePlanAggregateInput,
} from '@tet/backend/plans/plans/create-plan-aggregate/create-plan-aggregate.types';
import { importActionInputToUpdateFicheInput } from '@tet/backend/plans/plans/import-plan-aggregate/adapters/import-action-input-to-update-fiche-input';
import { ResolvedFicheEntities } from '@tet/backend/plans/plans/import-plan-aggregate/resolvers/resolve-entity.service';
import { ImportActionOrSousAction } from '@tet/backend/plans/plans/import-plan-aggregate/schemas/import-action.input';
import {
  FicheImportFields,
  FicheReference,
  FicheReferenceKindEnum,
  PlanReferenceProgrammeEnum,
} from '@tet/domain/plans';
import {
  PreparedElectrificationFiche,
  ResolvedElectrificationFiches,
} from '../resolve-fiches/electrification-fiches.schema';

type PlanIdentity = Pick<
  CreatePlanAggregateInput,
  'collectiviteId' | 'nom' | 'typeId'
>;
type FicheToCreate = Pick<
  AggregateFiche,
  'sourceKey' | 'axeSourceKey' | 'parentSourceKey' | 'reference' | 'documents'
> & { champs: FicheImportFields };
type PreparedFicheCreate = Extract<
  PreparedElectrificationFiche,
  { mode: 'create' }
>;

/** Adapte les clés résolues sans reconstruire la hiérarchie depuis les titres. */
export class ElectrificationPlanAdapter {
  static getEntityInputs(
    prepared: ResolvedElectrificationFiches
  ): ImportActionOrSousAction[] {
    return this.getFichesToCreate(prepared).map(({ champs }) =>
      this.toImportAction(champs)
    );
  }

  static toAggregate(
    input: PlanIdentity,
    prepared: ResolvedElectrificationFiches,
    entities: ResolvedFicheEntities[]
  ): CreatePlanAggregateInput {
    const fiches = this.getFichesToCreate(prepared);
    if (entities.length !== fiches.length) {
      throw new Error(
        'La résolution des entités ne couvre pas toutes les fiches'
      );
    }
    return {
      ...input,
      engagements: {
        programme: PlanReferenceProgrammeEnum.ELECTRIFICATION,
        codes: prepared.engagements.map(({ code }) => code),
      },
      axes: prepared.axes.map((axe) => ({
        sourceKey: axe.key,
        parentSourceKey: axe.parentKey ?? undefined,
        nom: axe.titre,
        reference:
          axe.numero === null
            ? undefined
            : {
                programme: PlanReferenceProgrammeEnum.ELECTRIFICATION,
                code: axe.numero,
              },
      })),
      fiches: fiches.map(({ champs, ...fiche }, index) => ({
        ...fiche,
        fiche: importActionInputToUpdateFicheInput(
          this.toImportAction(champs),
          entities[index]
        ),
      })),
      existingFiches: prepared.fiches.flatMap((fiche) =>
        fiche.mode === 'link'
          ? [
              {
                sourceKey: fiche.key,
                axeSourceKey: fiche.axeKey,
                ficheId: fiche.ficheId,
              },
            ]
          : []
      ),
    };
  }

  private static getFichesToCreate(
    prepared: ResolvedElectrificationFiches
  ): FicheToCreate[] {
    return [
      ...prepared.fichesEngagements.map((fiche) => ({
        sourceKey: fiche.key,
        axeSourceKey: fiche.axeKey,
        champs: { titre: fiche.titre, statut: fiche.statut },
        reference: this.reference(
          FicheReferenceKindEnum.ENGAGEMENT,
          fiche.engagementCode
        ),
      })),
      ...prepared.fiches.flatMap((fiche) =>
        fiche.mode === 'create' ? this.getFicheAndChildren(fiche) : []
      ),
    ];
  }

  private static getFicheAndChildren(
    fiche: PreparedFicheCreate
  ): FicheToCreate[] {
    const child = {
      axeSourceKey: fiche.axeKey,
      parentSourceKey: fiche.key,
    };
    return [
      {
        sourceKey: fiche.key,
        axeSourceKey: fiche.axeKey,
        champs: fiche.champs,
        documents: fiche.documents,
        reference: this.reference(FicheReferenceKindEnum.ACTION, fiche.code),
      },
      ...fiche.sousActions.map((sousAction) => ({
        ...child,
        sourceKey: sousAction.key,
        champs: sousAction.champs,
        reference: this.sousActionReference(sousAction.code, fiche.code),
      })),
      ...fiche.indicateurs.flatMap((indicateur) =>
        indicateur.mode === 'sous-action'
          ? [
              {
                ...child,
                sourceKey: `indicateur:${indicateur.source.key}`,
                champs: {
                  titre: indicateur.titre,
                  statut: indicateur.statut,
                  dateFin: indicateur.dateFin,
                },
                reference: this.reference(
                  FicheReferenceKindEnum.INDICATEUR_BOOLEEN,
                  indicateur.code
                ),
              },
            ]
          : []
      ),
    ];
  }

  private static reference(
    kind: Exclude<FicheReference['kind'], 'sous_action'>,
    code: string | null
  ): FicheReference | undefined {
    return code === null
      ? undefined
      : { programme: PlanReferenceProgrammeEnum.ELECTRIFICATION, kind, code };
  }

  private static sousActionReference(
    code: string | null,
    parentCode: string | null
  ): FicheReference | undefined {
    if (code === null) return undefined;
    if (parentCode === null) {
      throw new Error(
        'La sous-action catalogue doit conserver son action parente'
      );
    }
    return {
      programme: PlanReferenceProgrammeEnum.ELECTRIFICATION,
      kind: FicheReferenceKindEnum.SOUS_ACTION,
      code,
      parentCode,
    };
  }

  private static toImportAction(
    champs: FicheImportFields
  ): ImportActionOrSousAction {
    if (!champs.titre) {
      throw new Error('Le titre de la fiche préparée est obligatoire');
    }
    return {
      titre: champs.titre,
      description: champs.description ?? undefined,
      objectifs: champs.objectifs ?? undefined,
      resources: champs.ressources ?? undefined,
      gouvernance: undefined,
      financements: undefined,
      notesComplementaire: undefined,
      participationCitoyenne: undefined,
      priorite: undefined,
      participation: undefined,
      cible: undefined,
      status: champs.statut ?? undefined,
      dateDebut: champs.dateDebut ? new Date(champs.dateDebut) : undefined,
      dateFin: champs.dateFin ? new Date(champs.dateFin) : undefined,
      structures: champs.structures ?? [],
      partenaires: champs.partenaires ?? [],
      pilotes: [],
      referents: [],
      services: [],
      instanceGouvernance: [],
      financeurs: [],
      indicateurs: [],
    };
  }
}
