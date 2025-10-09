import { CollectiviteMembresService } from '@/backend/collectivites/membres/membres.service';
import { TagService } from '@/backend/collectivites/tags/tag.service';
import { TagEnum } from '@/backend/collectivites/tags/tag.table-base';
import { PersonOrTag } from '@/backend/plans/fiches/domain/fiche.types';
import {
  combineResults,
  failure,
  Result,
  success,
} from '@/backend/shared/types/result';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Injectable } from '@nestjs/common';
import { createPersonneResolver } from './personne.resolver';
import { createTagResolver } from './tag-resolver.factory';

/**
 * Fiche DTO with entity references (from Excel import)
 */
interface PlanFicheDto {
  axisPath: string[];
  pilotes: string[];
  referents: string[];
  structures: string[];
  services: string[];
  financeurs: Array<{ nom: string; montant: number }>;
  partenaires: string[];
}

/**
 * Resolved entities with IDs ready for persistence
 */
export interface ResolvedFicheEntities {
  axisPath: Array<string>;
  pilotes: Array<PersonOrTag>;
  referents: Array<PersonOrTag>;
  structures: Array<number>;
  services: Array<number>;
  financeurs: Array<{ tagId: number; montant: number }>;
  partenaires: Array<number>;
}

/**
 * Infrastructure Service: Entity Resolution
 *
 * Responsible for resolving string references from Excel to database entities.
 * This includes:
 * - Finding or creating tags for structures, services, financeurs, partenaires
 * - Finding or creating user/tag references for pilotes and referents
 *
 * This service orchestrates multiple resolvers and ensures uniqueness of resolved entities.
 *
 * Injectable service that can be easily mocked for testing.
 */
@Injectable()
export class EntityResolverService {
  constructor(
    private readonly memberService: CollectiviteMembresService,
    private readonly tagService: TagService
  ) {}

  /**
   * Resolves all entities for a list of fiches
   *
   * @param collectiviteId - The collectivité ID
   * @param fiches - The fiches with string references
   * @param tx - The database transaction
   * @returns Resolved entities with database IDs
   */
  async resolveFicheEntities(
    collectiviteId: number,
    fiches: PlanFicheDto[],
    tx: Transaction
  ): Promise<Result<ResolvedFicheEntities[], string>> {
    const { getOrCreatePersonne } = await createPersonneResolver(
      collectiviteId,
      this.memberService,
      this.tagService
    );

    const { getOrCreate: getOrCreateStructure } = await createTagResolver(
      collectiviteId,
      this.tagService,
      TagEnum.Structure
    );

    const { getOrCreate: getOrCreateFinanceur } = await createTagResolver(
      collectiviteId,
      this.tagService,
      TagEnum.Financeur
    );

    const { getOrCreate: getOrCreateService } = await createTagResolver(
      collectiviteId,
      this.tagService,
      TagEnum.Service
    );

    const { getOrCreate: getOrCreatePartenaire } = await createTagResolver(
      collectiviteId,
      this.tagService,
      TagEnum.Partenaire
    );

    const resolvers = {
      getOrCreatePersonne,
      getOrCreateStructure,
      getOrCreateService,
      getOrCreateFinanceur,
      getOrCreatePartenaire,
    };

    const results = await Promise.all(
      fiches.map(async (fiche) => {
        const result = await this.resolveSingleFiche(fiche, resolvers, tx);
        if (!result.success) {
          return result;
        }
        return success(result.data);
      })
    );

    return combineResults(results);
  }

  private async resolveSingleFiche(
    fiche: PlanFicheDto,
    resolvers: {
      getOrCreatePersonne: (
        name: string,
        tx: Transaction
      ) => Promise<Result<PersonOrTag, string>>;
      getOrCreateStructure: (
        name: string,
        tx: Transaction
      ) => Promise<Result<number, string>>;
      getOrCreateService: (
        name: string,
        tx: Transaction
      ) => Promise<Result<number, string>>;
      getOrCreateFinanceur: (
        name: string,
        tx: Transaction
      ) => Promise<Result<number, string>>;
      getOrCreatePartenaire: (
        name: string,
        tx: Transaction
      ) => Promise<Result<number, string>>;
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
    ] = await Promise.all([
      this.resolvePersons(fiche.pilotes, resolvers.getOrCreatePersonne, tx),
      this.resolvePersons(fiche.referents, resolvers.getOrCreatePersonne, tx),
      this.resolveSimpleEntities(
        fiche.structures,
        resolvers.getOrCreateStructure,
        tx
      ),
      this.resolveSimpleEntities(
        fiche.services,
        resolvers.getOrCreateService,
        tx
      ),
      this.resolveFinanceurs(
        fiche.financeurs,
        resolvers.getOrCreateFinanceur,
        tx
      ),
      this.resolveSimpleEntities(
        fiche.partenaires,
        resolvers.getOrCreatePartenaire,
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

    return success({
      axisPath: fiche.axisPath,
      pilotes: pilotesResult.data,
      referents: referentsResult.data,
      structures: structuresResult.data,
      services: servicesResult.data,
      financeurs: financeursResult.data,
      partenaires: partenairesResult.data,
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

        return success(
          result.data.userId
            ? { userId: result.data.userId }
            : { tagId: result.data.tagId as number }
        );
      })
    );

    return combineResults(results);
  }

  /**
   * Resolves simple entities (structures, services, partenaires) to tag IDs
   */
  private async resolveSimpleEntities(
    entities: string[],
    getOrCreateEntity: (
      name: string,
      tx: Transaction
    ) => Promise<Result<number, string>>,
    tx: Transaction
  ): Promise<Result<number[], string>> {
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

    return combineResults(results);
  }

  /**
   * Resolves financeurs with their amounts
   */
  private async resolveFinanceurs(
    financeurs: Array<{ nom: string; montant: number }>,
    getOrCreateFinanceur: (
      name: string,
      tx: Transaction
    ) => Promise<Result<number, string>>,
    tx: Transaction
  ): Promise<Result<Array<{ tagId: number; montant: number }>, string>> {
    const results = await Promise.all(
      financeurs.map(async (f) => {
        const result = await getOrCreateFinanceur(f.nom, tx);
        if (!result.success) {
          return failure(
            `Failed to resolve financeur "${f.nom}": ${result.error}`
          );
        }
        return success({
          tagId: result.data,
          montant: f.montant,
        });
      })
    );

    return combineResults(results);
  }
}
