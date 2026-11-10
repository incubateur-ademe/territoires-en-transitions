import { failure, Result, success } from '@tet/backend/utils/result.type';
import { Lien, lienInputSchema } from '@tet/domain/collectivites';
import { createPlanSchema } from '../upsert-plan/upsert-plan.input';
import {
  PlanAggregateReferences,
  PreparedPlanReferences,
} from './plan-aggregate-references.rules';
import {
  AggregateAxe,
  AggregateExistingFiche,
  AggregateFiche,
  CreatePlanAggregateInput,
} from './create-plan-aggregate.types';

type OrderedPlanStructure = Pick<
  CreatePlanAggregateInput,
  'axes' | 'fiches'
> & {
  references: PreparedPlanReferences;
};
type FicheToLink = AggregateFiche | AggregateExistingFiche;

/** Vérifie les identités de la requête et ordonne les parents avant leurs enfants. */
export class PlanAggregateStructure {
  static validateAndSort(
    input: CreatePlanAggregateInput
  ): Result<OrderedPlanStructure, string> {
    const plan = this.validatePlan(input);
    if (!plan.success) return plan;
    const references = PlanAggregateReferences.prepare(input);
    if (!references.success) return references;

    const axes = this.orderByParent(input.axes);
    if (!axes.success) return axes;
    const fiches = this.orderByParent(input.fiches);
    if (!fiches.success) return fiches;
    const documents = this.prepareDocuments(fiches.data);
    if (!documents.success) return documents;

    const links = this.validateFicheLinks(input.axes, [
      ...input.fiches,
      ...(input.existingFiches ?? []),
    ]);
    if (!links.success) return links;

    const existingFiches = this.validateExistingFicheIds(
      input.existingFiches ?? []
    );
    if (!existingFiches.success) return existingFiches;

    return success({
      axes: axes.data,
      fiches: documents.data,
      references: references.data,
    });
  }

  private static prepareDocuments(
    fiches: AggregateFiche[]
  ): Result<AggregateFiche[], string> {
    const result: AggregateFiche[] = [];
    for (const fiche of fiches) {
      const documents = new Map<string, Lien>();
      for (const document of fiche.documents ?? []) {
        const parsed = lienInputSchema.safeParse(document);
        if (!parsed.success) return failure(parsed.error.issues[0].message);
        if (!documents.has(parsed.data.url))
          documents.set(parsed.data.url, parsed.data);
      }
      result.push({ ...fiche, documents: [...documents.values()] });
    }
    return success(result);
  }

  private static validatePlan(
    input: CreatePlanAggregateInput
  ): Result<void, string> {
    // Les engagements appartiennent au contrat interne, pas au DTO public du plan.
    const plan = createPlanSchema.safeParse({
      collectiviteId: input.collectiviteId,
      nom: input.nom,
      typeId: input.typeId,
      dateDebut: input.dateDebut,
      dateFin: input.dateFin,
      pilotes: input.pilotes,
      referents: input.referents,
    });
    if (!plan.success) return failure(plan.error.issues[0].message);
    if (!input.nom.trim())
      return failure('Le nom du plan ne peut pas être vide');
    if (input.axes.some((axe) => !axe.nom.trim())) {
      return failure("Le nom d'un axe ne peut pas être vide");
    }

    return success(undefined);
  }

  private static validateFicheLinks(
    axes: AggregateAxe[],
    fiches: FicheToLink[]
  ): Result<void, string> {
    const axeKeys = new Set(axes.map((axe) => axe.sourceKey));
    const ficheKeys = new Set<string>();
    for (const fiche of fiches) {
      if (!fiche.sourceKey.trim() || ficheKeys.has(fiche.sourceKey)) {
        return failure('Les clés des fiches doivent être uniques et non vides');
      }
      ficheKeys.add(fiche.sourceKey);
      if (
        fiche.axeSourceKey !== undefined &&
        !axeKeys.has(fiche.axeSourceKey)
      ) {
        return failure(`Axe introuvable : ${fiche.axeSourceKey}`);
      }
    }
    return success(undefined);
  }

  private static validateExistingFicheIds(
    fiches: AggregateExistingFiche[]
  ): Result<void, string> {
    if (
      fiches.some(
        ({ ficheId }) => !Number.isSafeInteger(ficheId) || ficheId <= 0
      )
    ) {
      return failure('Identifiant de fiche existante invalide');
    }
    return success(undefined);
  }

  private static orderByParent<
    T extends { sourceKey: string; parentSourceKey?: string }
  >(items: T[]): Result<T[], string> {
    const sourceKeys = new Set<string>();
    for (const item of items) {
      if (!item.sourceKey.trim() || sourceKeys.has(item.sourceKey)) {
        return failure('Les clés doivent être uniques et non vides');
      }
      sourceKeys.add(item.sourceKey);
    }

    const children = new Map<string, T[]>();
    const ordered: T[] = [];
    for (const item of items) {
      if (item.parentSourceKey === undefined) {
        ordered.push(item);
        continue;
      }
      if (!sourceKeys.has(item.parentSourceKey)) {
        return failure(`Parent introuvable : ${item.parentSourceKey}`);
      }
      const siblings = children.get(item.parentSourceKey) ?? [];
      siblings.push(item);
      children.set(item.parentSourceKey, siblings);
    }
    for (let index = 0; index < ordered.length; index++) {
      ordered.push(...(children.get(ordered[index].sourceKey) ?? []));
    }
    if (ordered.length !== items.length) {
      return failure('La hiérarchie contient un cycle');
    }
    return success(ordered);
  }
}
