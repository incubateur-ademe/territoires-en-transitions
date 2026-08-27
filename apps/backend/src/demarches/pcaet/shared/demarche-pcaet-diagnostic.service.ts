import { Injectable, Logger } from '@nestjs/common';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import CrudValeursService from '@tet/backend/indicateurs/valeurs/crud-valeurs.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  buildTopicYears,
  DEMARCHE_PCAET_DIAGNOSTIC_TOPICS,
  DemarchePcaetTopicKindEnum,
  deriveReferenceYear,
  isDemarchePcaetDiagnosticComplet,
  listDemarchePcaetDiagnosticReferentielIds,
  normalizeExtraYears,
  type DemarchePcaetDiagnosticPayload,
  type DemarchePcaetDiagnosticReference,
  type DemarchePcaetDiagnosticTopicConfig,
  type DemarchePcaetDiagnosticTopicLeafConfig,
  type DemarchePcaetDiagnosticValeur,
  type DemarchePcaetTopic,
  type DemarchePcaetTopicLeaf,
  type DemarchePcaetTopicRow,
  type DemarchePcaetVulnerabilite,
} from '@tet/domain/demarches';
import { inArray } from 'drizzle-orm';
import { DemarchePcaetVulnerabiliteReadService } from './demarche-pcaet-vulnerabilite-read.service';

/**
 * Sources de référence proposées à côté de la saisie de la collectivité. Le
 * cadre de dépôt privilégie le RARE et les observatoires régionaux ; le CITEPA
 * est écarté, et la SNBC est une projection, pas un constat. L'Atmo couvre les
 * polluants atmosphériques, qu'aucune autre source retenue ne ventile.
 */
const REFERENCE_SOURCE_IDS = [
  'rare',
  'orcae',
  'terristory',
  'aldo',
  'atmo',
] as const;

/**
 * Source interne dédiée au dépôt PCAET : les valeurs portent une metadonnée,
 * mais dans la payload du diagnostic elles doivent être traitées comme des
 * saisies (donc publiées dans `resultat` / `objectif`, pas dans `references`).
 */
const PCAET_COLLECTIVITE_SOURCE_ID = 'pcaet-collectivite';

/** Valeur brute d'une cellule, avant séparation saisie / références. */
type ValeurBrute = {
  indicateurId: number;
  year: number;
  dateValeur: string;
  sourceId: string | null;
  millesime: string | null;
  resultat: number | null;
  objectif: number | null;
};

/**
 * Assemble le diagnostic d'une démarche : le référentiel (config domain) et les
 * valeurs `pcaet-collectivite`, servis ensemble pour que le front et le guard
 * `dossierComplet` appliquent la même règle au même objet.
 */
@Injectable()
export class DemarchePcaetDiagnosticService {
  private readonly logger = new Logger(DemarchePcaetDiagnosticService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly vulnerabiliteReadService: DemarchePcaetVulnerabiliteReadService,
    private readonly crudValeursService: CrudValeursService
  ) {}

  async loadPayload(
    {
      demarcheId,
      collectiviteId,
    }: { demarcheId: number; collectiviteId: number },
    tx?: Transaction
  ): Promise<DemarchePcaetDiagnosticPayload> {
    const referentielIds = listDemarchePcaetDiagnosticReferentielIds();
    const [indicateurByReferentiel, valeurs, vulnerabilite] = await Promise.all(
      [
        this.resolveIndicateurIds(referentielIds, tx),
        this.listValeurs(collectiviteId, referentielIds, tx),
        this.vulnerabiliteReadService.loadVulnerabilite(
          { demarcheId, collectiviteId },
          tx
        ),
      ]
    );

    const sansDefinition = referentielIds.filter(
      (id) => !indicateurByReferentiel.has(id)
    );
    if (sansDefinition.length > 0) {
      this.logger.warn(
        `Diagnostic PCAET : ${
          sansDefinition.length
        } identifiant(s) sans définition d'indicateur (${sansDefinition.join(
          ', '
        )})`
      );
    }

    return {
      topics: DEMARCHE_PCAET_DIAGNOSTIC_TOPICS.map((topic) =>
        this.toTopic(topic, indicateurByReferentiel, valeurs, vulnerabilite)
      ),
    };
  }

  /** Complétude de l'étape diagnostic, telle que la voit le guard du workflow. */
  async isDiagnosticComplet(
    input: { demarcheId: number; collectiviteId: number },
    tx?: Transaction
  ): Promise<boolean> {
    return isDemarchePcaetDiagnosticComplet(await this.loadPayload(input, tx));
  }

  private async resolveIndicateurIds(
    identifiantsReferentiel: string[],
    tx?: Transaction
  ): Promise<Map<string, number>> {
    if (identifiantsReferentiel.length === 0) {
      return new Map();
    }
    const db = tx ?? this.databaseService.db;
    const rows = await db
      .select({
        id: indicateurDefinitionTable.id,
        identifiantReferentiel:
          indicateurDefinitionTable.identifiantReferentiel,
      })
      .from(indicateurDefinitionTable)
      .where(
        inArray(
          indicateurDefinitionTable.identifiantReferentiel,
          identifiantsReferentiel
        )
      );

    return new Map(
      rows.flatMap((row) =>
        row.identifiantReferentiel === null
          ? []
          : [[row.identifiantReferentiel, row.id] as const]
      )
    );
  }

  private async listValeurs(
    collectiviteId: number,
    identifiantsReferentiel: string[],
    tx?: Transaction
  ): Promise<ValeurBrute[]> {
    if (identifiantsReferentiel.length === 0) {
      return [];
    }
    const rows = await this.crudValeursService.getIndicateursValeurs(
      {
        collectiviteId,
        identifiantsReferentiel,
        sources: [PCAET_COLLECTIVITE_SOURCE_ID, ...REFERENCE_SOURCE_IDS],
      },
      undefined,
      tx
    );

    const valeurs = rows.flatMap((row) => {
      const indicateurId = row.indicateurDefinition?.id;
      const dateValeur = row.indicateurValeur.dateValeur;
      if (indicateurId === undefined || dateValeur === null) {
        return [];
      }

      const rawSourceId = row.indicateur_source_metadonnee?.sourceId ?? null;
      const isPcaetSaisie = rawSourceId === PCAET_COLLECTIVITE_SOURCE_ID;
      return [
        {
          indicateurId,
          year: Number(dateValeur.slice(0, 4)),
          dateValeur,
          sourceId: row.indicateurSourceMetadonnee?.sourceId ?? null,
          millesime: row.indicateurSourceMetadonnee?.dateVersion ?? null,
          resultat: row.indicateurValeur.resultat ?? null,
          objectif: row.indicateurValeur.objectif ?? null,
        },
      ];
    });

    return valeurs.sort(
      (a, b) =>
        a.dateValeur.localeCompare(b.dateValeur) ||
        (a.millesime ?? '').localeCompare(b.millesime ?? '') ||
        (a.sourceId ?? '').localeCompare(b.sourceId ?? '')
    );
  }

  private toLeaf(
    row: DemarchePcaetDiagnosticTopicLeafConfig,
    indicateurByReferentiel: Map<string, number>
  ): DemarchePcaetTopicLeaf {
    return {
      label: row.label,
      referentielId: row.referentielId,
      indicateurId:
        row.referentielId === null
          ? null
          : indicateurByReferentiel.get(row.referentielId) ?? null,
      requis: row.requis,
    };
  }

  private toRows(
    topic: DemarchePcaetDiagnosticTopicConfig,
    indicateurByReferentiel: Map<string, number>
  ): { rows: DemarchePcaetTopicRow[]; indicateurIds: number[] } {
    const indicateurIds: number[] = [];
    const rows: DemarchePcaetTopicRow[] = topic.rows.map((row) => {
      const leaf = this.toLeaf(row, indicateurByReferentiel);
      if (leaf.indicateurId !== null) {
        indicateurIds.push(leaf.indicateurId);
      }
      const children = row.rows.map((child) => {
        const childLeaf = this.toLeaf(child, indicateurByReferentiel);
        if (childLeaf.indicateurId !== null) {
          indicateurIds.push(childLeaf.indicateurId);
        }
        return childLeaf;
      });
      return { ...leaf, rows: children };
    });
    return { rows, indicateurIds };
  }

  private toTopic(
    topic: DemarchePcaetDiagnosticTopicConfig,
    indicateurByReferentiel: Map<string, number>,
    valeurs: ValeurBrute[],
    vulnerabilite: DemarchePcaetVulnerabilite
  ): DemarchePcaetTopic {
    const { rows, indicateurIds } = this.toRows(topic, indicateurByReferentiel);

    const base = {
      code: topic.code,
      label: topic.label,
      icon: topic.icon,
      kind: topic.kind,
      groupLabel: topic.groupLabel,
      rowLabel: topic.rowLabel,
      unit: topic.unit,
      referentielId: topic.referentielId,
      horizons: [...topic.horizons],
      rows,
    };

    if (topic.kind !== DemarchePcaetTopicKindEnum.INDICATEURS) {
      return {
        ...base,
        referenceYear: null,
        extraYears: [],
        years: [],
        valeurs: [],
        vulnerabilite:
          topic.kind === DemarchePcaetTopicKindEnum.VULNERABILITE
            ? vulnerabilite
            : null,
      };
    }

    const topicIndicateurIds = new Set(indicateurIds);
    const topicValeurs = valeurs.filter((valeur) =>
      topicIndicateurIds.has(valeur.indicateurId)
    );
    const saisies = topicValeurs.filter((valeur) => valeur.sourceId === null);

    const referenceYear = deriveReferenceYear({
      resultYears: saisies
        .filter((valeur) => valeur.resultat !== null)
        .map((valeur) => valeur.year),
      currentYear: new Date().getFullYear(),
    });
    const valueYears = [
      ...new Set(
        saisies
          .filter(
            (valeur) => valeur.resultat !== null || valeur.objectif !== null
          )
          .map((valeur) => valeur.year)
      ),
    ];
    const extraYears = normalizeExtraYears({
      extraYears: valueYears,
      referenceYear,
      horizons: topic.horizons,
    });
    const years = buildTopicYears({
      referenceYear,
      horizons: topic.horizons,
      extraYears,
    });

    return {
      ...base,
      referenceYear,
      extraYears,
      years,
      valeurs: this.toCells(topicValeurs, indicateurIds, new Set(years)),
      vulnerabilite: null,
    };
  }

  private toCells(
    topicValeurs: ValeurBrute[],
    indicateurIds: number[],
    years: Set<number>
  ): DemarchePcaetDiagnosticValeur[] {
    const cells = new Map<string, DemarchePcaetDiagnosticValeur>();

    for (const indicateurId of indicateurIds) {
      for (const year of years) {
        cells.set(`${indicateurId}:${year}`, {
          indicateurId,
          year,
          resultat: null,
          objectif: null,
          references: [],
        });
      }
    }

    for (const valeur of topicValeurs) {
      const cell = cells.get(`${valeur.indicateurId}:${valeur.year}`);
      if (!cell) {
        continue;
      }
      if (valeur.sourceId === null) {
        cell.resultat = valeur.resultat ?? cell.resultat;
        cell.objectif = valeur.objectif ?? cell.objectif;
      } else {
        const reference: DemarchePcaetDiagnosticReference = {
          sourceId: valeur.sourceId,
          millesime: valeur.millesime,
          resultat: valeur.resultat,
        };
        cell.references.push(reference);
      }
    }

    return [...cells.values()];
  }
}
