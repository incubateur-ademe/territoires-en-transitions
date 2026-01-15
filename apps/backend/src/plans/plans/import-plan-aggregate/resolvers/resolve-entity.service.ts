import { Injectable } from '@nestjs/common';
import { ListMembresService } from '@tet/backend/collectivites/membres/list-membres/list-membres.service';
import { ListTagsService } from '@tet/backend/collectivites/tags/list-tags/list-tags.service';
import { MutateTagService } from '@tet/backend/collectivites/tags/mutate-tag/mutate-tag.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  combineResults,
  failure,
  Result,
  success,
} from '@tet/backend/utils/result.type';
import { Tag, TagEnum } from '@tet/domain/collectivites';
import { ImportActionOrSousAction } from '../schemas/import-action.input';
import {
  deduplicateById,
  deduplicatePersons,
} from '../utils/deduplication.utils';
import { createPersonneResolver } from './personne.resolver';
import { createTagResolver } from './tag.resolver';

export type PersonOrTag = { userId?: string; tagId?: number };

/**
 * Resolved entities with IDs ready for persistence
 */
export interface ResolvedFicheEntities {
  instanceGouvernance: Array<Tag>;
  titre: string;
  axisPath?: string[];
  pilotes: Array<PersonOrTag>;
  referents: Array<PersonOrTag>;
  structures: Array<Tag>;
  services: Array<Tag>;
  financeurs: Array<Tag & { montant: number }>;
  partenaires: Array<Tag>;
}

@Injectable()
export class ResolveEntityService {
  constructor(
    private readonly listMembresService: ListMembresService,
    private readonly listTagsService: ListTagsService,
    private readonly mutateTagService: MutateTagService
  ) {}

  /**
   * Resolves all entities for a list of actions
   *
   * @param collectiviteId - The collectivité ID
   * @param actions - The actions with string references
   * @param tx - The database transaction
   * @param user - Authenticated user required for instance gouvernance tags
   * @returns Resolved entities with database IDs
   */
  async resolveFicheEntities(
    collectiviteId: number,
    actions: ImportActionOrSousAction[],
    tx: Transaction,
    user: AuthenticatedUser
  ): Promise<Result<ResolvedFicheEntities[], string>> {
    const { getOrCreatePersonne } = await createPersonneResolver(
      collectiviteId,
      this.listMembresService,
      this.listTagsService,
      this.mutateTagService,
      user,
      tx
    );
    const { getOrCreate: getOrCreateStructure } = await createTagResolver(
      collectiviteId,
      this.listTagsService,
      this.mutateTagService,
      TagEnum.Structure,
      undefined,
      user,
      tx
    );

    const { getOrCreate: getOrCreateFinanceur } = await createTagResolver(
      collectiviteId,
      this.listTagsService,
      this.mutateTagService,
      TagEnum.Financeur,
      undefined,
      user,
      tx
    );

    const { getOrCreate: getOrCreateService } = await createTagResolver(
      collectiviteId,
      this.listTagsService,
      this.mutateTagService,
      TagEnum.Service,
      undefined,
      user,
      tx
    );

    const { getOrCreate: getOrCreatePartenaire } = await createTagResolver(
      collectiviteId,
      this.listTagsService,
      this.mutateTagService,
      TagEnum.Partenaire,
      undefined,
      user,
      tx
    );

    const { getOrCreate: getOrCreateInstanceGouvernance } =
      await createTagResolver(
        collectiviteId,
        this.listTagsService,
        this.mutateTagService,
        TagEnum.InstanceGouvernance,
        undefined,
        user,
        tx
      );

    const resolvers = {
      getOrCreatePersonne,
      getOrCreateStructure,
      getOrCreateService,
      getOrCreateFinanceur,
      getOrCreatePartenaire,
      getOrCreateInstanceGouvernance,
    };

    const results = await Promise.all(
      actions.map(async (action) => {
        const result = await this.resolveSingleAction(action, resolvers, tx);
        if (!result.success) {
          return result;
        }
        return success(result.data);
      })
    );

    return combineResults(results);
  }

  private async resolveSingleAction(
    action: ImportActionOrSousAction,
    resolvers: {
      getOrCreateInstanceGouvernance: (
        name: string
      ) => Promise<Result<Tag, string>>;
      getOrCreatePersonne: (
        name: string
      ) => Promise<Result<PersonOrTag, string>>;
      getOrCreateStructure: (name: string) => Promise<Result<Tag, string>>;
      getOrCreateService: (name: string) => Promise<Result<Tag, string>>;
      getOrCreateFinanceur: (name: string) => Promise<Result<Tag, string>>;
      getOrCreatePartenaire: (name: string) => Promise<Result<Tag, string>>;
    },
    tx: Transaction
  ): Promise<Result<ResolvedFicheEntities, string>> {
    const [
      pilotesResult,
      referentsResult,
      structuresResult,
      servicesResult,
      financeursResult,
      partenairesResult,
      instanceGouvernanceResult,
    ] = await Promise.all([
      this.resolvePersons(action.pilotes, resolvers.getOrCreatePersonne, tx),
      this.resolvePersons(action.referents, resolvers.getOrCreatePersonne, tx),
      this.resolveSimpleEntities(
        action.structures,
        resolvers.getOrCreateStructure,
        tx
      ),
      this.resolveSimpleEntities(
        action.services,
        resolvers.getOrCreateService,
        tx
      ),
      this.resolveFinanceurs(
        action.financeurs,
        resolvers.getOrCreateFinanceur,
        tx
      ),
      this.resolveSimpleEntities(
        action.partenaires,
        resolvers.getOrCreatePartenaire,
        tx
      ),
      this.resolveSimpleEntities(
        action.instanceGouvernance,
        resolvers.getOrCreateInstanceGouvernance,
        tx
      ),
    ]);

    if (!pilotesResult.success) {
      return pilotesResult;
    }
    if (!referentsResult.success) return referentsResult;
    if (!structuresResult.success) return structuresResult;
    if (!servicesResult.success) return servicesResult;
    if (!financeursResult.success) return financeursResult;
    if (!partenairesResult.success) return partenairesResult;
    if (!instanceGouvernanceResult.success) return instanceGouvernanceResult;

    return success({
      titre: action.titre,
      axisPath: action.axisPath,
      pilotes: pilotesResult.data,
      referents: referentsResult.data,
      structures: structuresResult.data,
      services: servicesResult.data,
      financeurs: financeursResult.data,
      partenaires: partenairesResult.data,
      instanceGouvernance: instanceGouvernanceResult.data,
    });
  }

  private async resolvePersons(
    persons: string[],
    getOrCreatePersonne: (
      name: string,
      tx: Transaction
    ) => Promise<Result<PersonOrTag, string>>,
    tx: Transaction
  ): Promise<Result<Array<PersonOrTag>, string>> {
    const uniquePersons = Array.from(new Set(persons));

    const results = await Promise.all(
      uniquePersons.map(async (person) => {
        const result = await getOrCreatePersonne(person, tx);
        if (!result.success) {
          return failure(
            `Failed to resolve person "${person}": ${result.error}`
          );
        }

        if (!result.data.userId && !result.data.tagId) {
          return failure(
            `Invalid person resolution for "${person}": neither userId nor tagId was provided`
          );
        }

        return success(result.data);
      })
    );

    const combinedResult = combineResults(results);
    if (!combinedResult.success) {
      return combinedResult;
    }

    return success(deduplicatePersons(combinedResult.data));
  }

  private async resolveSimpleEntities(
    entities: string[],
    getOrCreateEntity: (
      name: string,
      tx: Transaction
    ) => Promise<Result<Tag, string>>,
    tx: Transaction
  ): Promise<Result<Tag[], string>> {
    // Use Set to ensure uniqueness of input names
    const uniqueEntities = Array.from(new Set(entities));

    const results = await Promise.all(
      uniqueEntities.map(async (name) => {
        const result = await getOrCreateEntity(name, tx);
        if (!result.success) {
          return failure(`Failed to resolve entity "${name}": ${result.error}`);
        }
        return success(result.data);
      })
    );

    const combinedResult = combineResults(results);
    if (!combinedResult.success) {
      return combinedResult;
    }

    return success(deduplicateById(combinedResult.data));
  }

  private async resolveFinanceurs(
    financeurs: Array<{ nom: string; montant: number }>,
    getOrCreateFinanceur: (
      name: string,
      tx: Transaction
    ) => Promise<Result<Tag, string>>,
    tx: Transaction
  ): Promise<Result<Array<Tag & { montant: number }>, string>> {
    const results = await Promise.all(
      financeurs.map(async (f) => {
        const result = await getOrCreateFinanceur(f.nom, tx);
        if (!result.success) {
          return failure(
            `Failed to resolve financeur "${f.nom}": ${result.error}`
          );
        }
        return success({
          ...result.data,
          montant: f.montant,
        });
      })
    );

    const combinedResult = combineResults(results);
    if (!combinedResult.success) {
      return combinedResult;
    }

    return success(deduplicateById(combinedResult.data));
  }
}
