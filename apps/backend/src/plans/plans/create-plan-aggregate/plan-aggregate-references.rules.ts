import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  AxeReference,
  axeReferenceSchema,
  FicheReference,
  FicheReferenceKindEnum,
  ficheReferenceSchema,
  PlanEngagements,
  planEngagementsSchema,
} from '@tet/domain/plans';
import { CreatePlanAggregateInput } from './create-plan-aggregate.types';

export type PreparedPlanReferences = {
  engagements?: PlanEngagements;
  axes: { sourceKey: string; reference: AxeReference }[];
  fiches: { sourceKey: string; reference: FicheReference }[];
};

/** Les codes sont déjà résolus ; cette étape vérifie leur attribution aux objets créés. */
export class PlanAggregateReferences {
  static prepare(
    input: CreatePlanAggregateInput
  ): Result<PreparedPlanReferences, string> {
    const references: PreparedPlanReferences = { axes: [], fiches: [] };
    if (input.existingFiches?.some((fiche) => 'reference' in fiche)) {
      return failure('Une fiche existante ne peut pas recevoir de référence');
    }
    if (input.engagements !== undefined) {
      if (input.planId !== undefined) {
        return failure('Les engagements sont attribués à la création du plan');
      }
      const parsed = planEngagementsSchema.safeParse(input.engagements);
      if (!parsed.success) return failure(parsed.error.issues[0].message);
      if (new Set(parsed.data.codes).size !== parsed.data.codes.length) {
        return failure('Les engagements retenus doivent être uniques');
      }
      references.engagements = parsed.data;
    }

    const axeCodes = new Set<string>();
    for (const axe of input.axes) {
      if (axe.reference === undefined) continue;
      const parsed = axeReferenceSchema.safeParse(axe.reference);
      if (!parsed.success) return failure(parsed.error.issues[0].message);
      if (parsed.data.programme !== references.engagements?.programme) {
        return failure(
          "La référence de l'axe doit appartenir au programme du plan"
        );
      }
      if (axeCodes.has(parsed.data.code)) {
        return failure(
          "Une référence d'axe ne peut être attribuée qu'une fois"
        );
      }
      axeCodes.add(parsed.data.code);
      references.axes.push({
        sourceKey: axe.sourceKey,
        reference: parsed.data,
      });
    }

    const ficheCodes = new Set<string>();
    for (const fiche of input.fiches) {
      if (fiche.reference === undefined) continue;
      const parsed = ficheReferenceSchema.safeParse(fiche.reference);
      if (!parsed.success) return failure(parsed.error.issues[0].message);
      const reference = parsed.data;
      if (reference.programme !== references.engagements?.programme) {
        return failure(
          'La référence de la fiche doit appartenir au programme du plan'
        );
      }
      if (
        reference.kind === FicheReferenceKindEnum.ENGAGEMENT &&
        !references.engagements.codes.includes(reference.code)
      ) {
        return failure('La fiche doit correspondre à un engagement retenu');
      }
      if (
        (reference.kind === FicheReferenceKindEnum.SOUS_ACTION ||
          reference.kind === FicheReferenceKindEnum.INDICATEUR_BOOLEEN) &&
        fiche.parentSourceKey === undefined
      ) {
        return failure(
          'La référence de sous-action nécessite une fiche parente'
        );
      }
      const key = JSON.stringify([
        fiche.parentSourceKey ?? null,
        reference.kind,
        reference.parentCode ?? null,
        reference.code,
      ]);
      if (
        reference.kind !== FicheReferenceKindEnum.ACTION &&
        ficheCodes.has(key)
      ) {
        return failure(
          "Une référence de fiche ne peut être attribuée qu'une fois"
        );
      }
      ficheCodes.add(key);
      references.fiches.push({ sourceKey: fiche.sourceKey, reference });
    }
    return success(references);
  }
}
