import { Injectable } from '@nestjs/common';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type { ImportIndicateurDefinitionType } from './import-indicateur-definition.dto';
import type { ImportIndicateurDefinitionError } from './import-indicateur-definition.errors';
import {
  ImportIndicateurDefinitionRepository,
  type ImportCategorieRelation,
  type ImportThematiqueRelation,
  type ImportGroupRelation,
} from './import-indicateur-definition.repository';
import type { ImportIndicateurContext } from './import-indicateur-definition.types';

type ImportedDefinition = { id: number; identifiantReferentiel: string | null };

/** Replaces the catalog-owned relations inside the catalog transaction. */
@Injectable()
export class ImportIndicateurRelationsService {
  constructor(
    private readonly repository: ImportIndicateurDefinitionRepository
  ) {}

  async replace(
    {
      definitions,
      created,
    }: {
      definitions: ImportIndicateurDefinitionType[];
      created: ImportedDefinition[];
    },
    { tx }: ImportIndicateurContext & { tx: Transaction }
  ): Promise<Result<void, ImportIndicateurDefinitionError>> {
    try {
      const [categories, thematiques] = await Promise.all([
        this.repository.listCategories(tx),
        this.repository.listThematiques(tx),
      ]);
      const categoryIds = new Map(categories.map(({ nom, id }) => [nom, id]));
      const thematiqueIds = new Map(
        thematiques.map(({ mdId, id }) => [mdId, id])
      );
      const missingCategories = [
        ...new Set(
          definitions.flatMap((definition) => definition.categories ?? [])
        ),
      ].filter((name) => !categoryIds.has(name));
      const missingThematiques = [
        ...new Set(
          definitions.flatMap((definition) => definition.thematiques ?? [])
        ),
      ].filter((name) => !thematiqueIds.has(name));
      if (missingCategories.length) {
        const added = await this.repository.createCategories(
          missingCategories.map((nom) => ({ nom })),
          tx
        );
        for (const { nom, id } of added) categoryIds.set(nom, id);
      }
      if (missingThematiques.length) {
        const added = await this.repository.createThematiques(
          missingThematiques.map((nom) => ({ nom, mdId: nom })),
          tx
        );
        thematiques.push(...added);
      }
      // Preserve the historical mdId/name matching for imported thematiques.
      const categoryRelations: ImportCategorieRelation[] = [];
      const thematiqueRelations: ImportThematiqueRelation[] = [];
      const groupRelations: ImportGroupRelation[] = [];
      const definitionIds = new Map(
        created.map(({ id, identifiantReferentiel }) => [
          identifiantReferentiel,
          id,
        ])
      );
      for (const definition of definitions) {
        const indicateurId = definitionIds.get(
          definition.identifiantReferentiel
        );
        if (!indicateurId) continue;
        for (const name of definition.categories ?? []) {
          const categorieTagId = categoryIds.get(name);
          if (!categorieTagId)
            return failure(
              'INVALID_IMPORT',
              new Error(
                `Categorie ${name} not found for indicateur ${definition.identifiantReferentiel}`
              )
            );
          categoryRelations.push({ indicateurId, categorieTagId });
        }
        for (const name of definition.thematiques ?? []) {
          const thematiqueId = thematiques.find(
            ({ mdId, nom }) => mdId === name || nom === name
          )?.id;
          if (!thematiqueId)
            return failure(
              'INVALID_IMPORT',
              new Error(
                `Thematique ${name} not found for indicateur ${definition.identifiantReferentiel}`
              )
            );
          thematiqueRelations.push({ indicateurId, thematiqueId });
        }
        for (const parentIdentifiant of definition.parents ?? []) {
          const parent = definitionIds.get(parentIdentifiant);
          if (parent) groupRelations.push({ enfant: indicateurId, parent });
        }
      }
      const ids = created.map(({ id }) => id);
      await this.repository.replaceCategorieRelations(
        ids,
        categoryRelations,
        tx
      );
      await this.repository.replaceThematiqueRelations(
        ids,
        thematiqueRelations,
        tx
      );
      await this.repository.replaceGroupRelations(ids, groupRelations, tx);
      return success(undefined);
    } catch (error) {
      return failure(
        'DATABASE_ERROR',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
