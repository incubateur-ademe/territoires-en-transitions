import { Injectable, Logger } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import { referentielDefinitionTable } from '@tet/backend/referentiels/models/referentiel-definition.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  ActionId,
  ActionTextOverrides,
  ReferentielId,
  TEMPLATED_ACTION_FIELDS,
} from '@tet/domain/referentiels';
import { IdentiteCollectivite } from '@tet/domain/collectivites';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import { renderActionTextTemplateForVariant } from './action-text-template-condition.visitor';
import { parseActionTextTemplate } from './action-text-template.rules';
import {
  buildTextVariantKey,
  parseTextVariantKey,
  TEMPLATE_REFERENCE_VARIANT,
  TemplateVariant,
} from './action-text-variant.rules';

export type ActionTextOverridesById = Record<ActionId, ActionTextOverrides>;

type ActionTreeNodeWithNom<T> = {
  actionId: ActionId;
  nom?: string | null;
  actionsEnfant: T[];
};

export type TextOverridesForVariant = {
  referentielVersion: string;
  overridesById: ActionTextOverridesById;
};

/** Nombre de (référentiel, version, variante) gardés en mémoire */
const CACHE_MAX_ENTRIES = 50;

/**
 * Rend les textes balisés des actions pour le profil d'une collectivité.
 *
 * Le rendu par défaut est stocké dans les colonnes de `action_definition` ;
 * ce service calcule, pour un profil (clé de variante), les seuls champs qui
 * en diffèrent. Le résultat d'une (référentiel, version, variante) ne change
 * jamais : il est gardé en mémoire sans invalidation.
 */
@Injectable()
export class RenderActionTextsService {
  private readonly logger = new Logger(RenderActionTextsService.name);

  private readonly cache = new Map<string, ActionTextOverridesById>();

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly collectivitesService: CollectivitesService
  ) {}

  /**
   * Clé de variante d'une collectivité, `null` pour le profil de référence.
   * Accepte l'identité déjà chargée, pour éviter de la relire.
   */
  async getTextVariantKey(
    collectivite: number | IdentiteCollectivite
  ): Promise<string | null> {
    const identite =
      typeof collectivite === 'number'
        ? await this.collectivitesService.getCollectiviteAvecType(collectivite)
        : collectivite;
    return buildTextVariantKey(identite);
  }

  /**
   * Surcharges d'un profil pour la version publiée d'un référentiel, renvoyée
   * avec. Échoue si la clé est invalide.
   */
  async getTextOverridesForVariant(
    referentielId: ReferentielId,
    textVariantKey: string,
    { tx }: { tx?: Transaction } = {}
  ): Promise<
    Result<TextOverridesForVariant, 'INVALID_TEXT_VARIANT_KEY' | 'NOT_FOUND'>
  > {
    const variant = parseTextVariantKey(textVariantKey);
    if (!variant) {
      return failure('INVALID_TEXT_VARIANT_KEY');
    }
    const byReferentiel = await this.listTextOverrides(
      variant,
      textVariantKey,
      [referentielId],
      tx
    );
    const forReferentiel = byReferentiel.get(referentielId);
    if (!forReferentiel) {
      return failure('NOT_FOUND');
    }
    return success(forReferentiel);
  }

  /**
   * Surcharges des textes pour une collectivité, toutes actions confondues ou
   * pour un référentiel. Vide pour le profil de référence, sans lecture en
   * base.
   */
  async getTextOverrides(
    collectivite: number | IdentiteCollectivite,
    {
      referentielId,
      tx,
    }: { referentielId?: ReferentielId; tx?: Transaction } = {}
  ): Promise<Map<ActionId, ActionTextOverrides>> {
    const textVariantKey = await this.getTextVariantKey(collectivite);
    const overrides = new Map<ActionId, ActionTextOverrides>();
    if (textVariantKey === null) {
      return overrides;
    }
    const variant = parseTextVariantKey(textVariantKey);
    if (!variant) {
      return overrides;
    }

    const byReferentiel = await this.listTextOverrides(
      variant,
      textVariantKey,
      referentielId ? [referentielId] : undefined,
      tx
    );
    for (const { overridesById } of byReferentiel.values()) {
      for (const [actionId, actionOverrides] of Object.entries(overridesById)) {
        overrides.set(actionId, actionOverrides);
      }
    }
    return overrides;
  }

  /**
   * Surcharges pour plusieurs collectivités, chargées une fois par
   * collectivité (et une fois par profil en base, grâce au cache).
   */
  async getTextOverridesByCollectivite(
    collectiviteIds: Iterable<number>
  ): Promise<Map<number, Map<ActionId, ActionTextOverrides>>> {
    const ids = [...new Set(collectiviteIds)];
    const entries = await Promise.all(
      ids.map(
        async (collectiviteId) =>
          [collectiviteId, await this.getTextOverrides(collectiviteId)] as const
      )
    );
    return new Map(entries);
  }

  /**
   * Remplace le nom des lignes par celui rendu pour la collectivité. Les
   * lignes sans surcharge sont renvoyées telles quelles.
   */
  async applyNomOverrides<T>(
    collectiviteId: number,
    rows: T[],
    {
      getActionId,
      setNom,
    }: {
      getActionId: (row: T) => ActionId | null | undefined;
      setNom: (row: T, nom: string) => T;
    }
  ): Promise<T[]> {
    if (rows.length === 0) {
      return rows;
    }
    const overrides = await this.getTextOverrides(collectiviteId);
    if (overrides.size === 0) {
      return rows;
    }
    return rows.map((row) => {
      const actionId = getActionId(row);
      const nom = actionId ? overrides.get(actionId)?.nom : undefined;
      return nom === undefined ? row : setNom(row, nom);
    });
  }

  /**
   * Remplace le nom des nœuds d'un arbre d'actions par celui rendu pour la
   * collectivité. Renvoie une copie : l'arbre reçu peut être partagé entre
   * collectivités.
   */
  async applyNomOverridesToTree<T extends ActionTreeNodeWithNom<T>>(
    collectivite: number | IdentiteCollectivite,
    tree: T
  ): Promise<T> {
    const overrides = await this.getTextOverrides(collectivite);
    if (overrides.size === 0) {
      return tree;
    }
    const walk = (node: T): T => {
      const nom = overrides.get(node.actionId)?.nom;
      return {
        ...node,
        ...(nom !== undefined ? { nom } : {}),
        actionsEnfant: node.actionsEnfant.map(walk),
      };
    };
    return walk(tree);
  }

  /** Réservé aux tests qui modifient `templates` sans changer de version. */
  clearCacheForTests() {
    this.cache.clear();
  }

  private async listTextOverrides(
    variant: TemplateVariant,
    textVariantKey: string,
    referentielIds: ReferentielId[] | undefined,
    tx: Transaction | undefined
  ): Promise<Map<ReferentielId, TextOverridesForVariant>> {
    const read = async (db: Transaction) => {
      const versions = await db
        .select({
          referentielId: referentielDefinitionTable.id,
          version: referentielDefinitionTable.version,
        })
        .from(referentielDefinitionTable)
        .where(
          referentielIds
            ? inArray(referentielDefinitionTable.id, referentielIds)
            : undefined
        );

      const result = new Map<ReferentielId, TextOverridesForVariant>();
      const missing: ReferentielId[] = [];
      for (const { referentielId, version } of versions) {
        const cached = this.cache.get(
          getCacheKey(referentielId, version, textVariantKey)
        );
        if (cached) {
          result.set(referentielId, {
            referentielVersion: version,
            overridesById: cached,
          });
        } else {
          missing.push(referentielId);
        }
      }
      if (missing.length === 0) {
        return result;
      }

      const rows = await db
        .select({
          actionId: actionDefinitionTable.actionId,
          referentielId: actionDefinitionTable.referentielId,
          templates: actionDefinitionTable.templates,
        })
        .from(actionDefinitionTable)
        .innerJoin(
          referentielDefinitionTable,
          and(
            eq(
              referentielDefinitionTable.id,
              actionDefinitionTable.referentielId
            ),
            eq(
              referentielDefinitionTable.version,
              actionDefinitionTable.referentielVersion
            )
          )
        )
        .where(
          and(
            isNotNull(actionDefinitionTable.templates),
            inArray(actionDefinitionTable.referentielId, missing)
          )
        );

      for (const referentielId of missing) {
        const version = versions.find(
          (row) => row.referentielId === referentielId
        )?.version as string;
        const overridesById = this.renderOverrides(
          rows.filter((row) => row.referentielId === referentielId),
          variant
        );
        this.setCache(
          getCacheKey(referentielId, version, textVariantKey),
          overridesById
        );
        result.set(referentielId, {
          referentielVersion: version,
          overridesById,
        });
      }
      return result;
    };

    if (tx) {
      return read(tx);
    }
    // la version et les lignes viennent du même instantané
    return this.databaseService.db.transaction(read, {
      isolationLevel: 'repeatable read',
      accessMode: 'read only',
    });
  }

  private renderOverrides(
    rows: Array<{
      actionId: ActionId;
      templates: Partial<Record<string, string>> | null;
    }>,
    variant: TemplateVariant
  ): ActionTextOverridesById {
    const overridesById: ActionTextOverridesById = {};
    for (const { actionId, templates } of rows) {
      if (!templates) {
        continue;
      }
      const overrides: ActionTextOverrides = {};
      for (const field of TEMPLATED_ACTION_FIELDS) {
        const source = templates[field];
        if (typeof source !== 'string') {
          continue;
        }
        try {
          const parsed = parseActionTextTemplate(source);
          if (!parsed.success) {
            throw new Error(parsed.error);
          }
          const rendered = renderActionTextTemplateForVariant(
            parsed.template,
            variant
          );
          const defaultRendered = renderActionTextTemplateForVariant(
            parsed.template,
            TEMPLATE_REFERENCE_VARIANT
          );
          if (rendered !== defaultRendered) {
            overrides[field] = rendered;
          }
        } catch (error) {
          // validé à l'import : ne devrait pas arriver, on garde le défaut
          this.logger.error(
            `Texte balisé invalide (${actionId}, ${field}) : ${getErrorMessage(
              error
            )}`
          );
        }
      }
      if (Object.keys(overrides).length > 0) {
        overridesById[actionId] = overrides;
      }
    }
    return overridesById;
  }

  private setCache(key: string, value: ActionTextOverridesById) {
    if (this.cache.size >= CACHE_MAX_ENTRIES) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, value);
  }
}

function getCacheKey(
  referentielId: ReferentielId,
  version: string,
  textVariantKey: string
): string {
  return `${referentielId}:${version}:${textVariantKey}`;
}
