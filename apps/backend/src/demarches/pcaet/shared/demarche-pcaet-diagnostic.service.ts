import { Injectable, Logger } from '@nestjs/common';
import CrudValeursService from '@tet/backend/indicateurs/valeurs/crud-valeurs.service';
import { COLLECTIVITE_SOURCE_ID } from '@tet/backend/indicateurs/valeurs/valeurs.constants';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  buildTopicYears,
  DemarchePcaetTopicKindEnum,
  deriveReferenceYear,
  isDemarchePcaetDiagnosticComplet,
  normalizeExtraYears,
  type DemarchePcaetDiagnosticPayload,
  type DemarchePcaetDiagnosticReference,
  type DemarchePcaetDiagnosticValeur,
  type DemarchePcaetTopic,
  type DemarchePcaetTopicLeaf,
  type DemarchePcaetTopicRow,
  type DemarchePcaetVulnerabilite,
} from '@tet/domain/demarches';
import {
  DemarchePcaetDiagnosticRepository,
  type DiagnosticStructureRow,
  type DiagnosticTopicYears,
} from './demarche-pcaet-diagnostic.repository';
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

/** Un topic et ses lignes, avant résolution des valeurs. */
type TopicStructure = {
  header: DiagnosticStructureRow;
  rows: DemarchePcaetTopicRow[];
  indicateurIds: number[];
};

/** Valeur brute d'une cellule, avant séparation saisie / références. */
type ValeurBrute = {
  indicateurId: number;
  year: number;
  /** `indicateur_valeur` est unique à la date près, pas à l'année : la date
   * départage deux valeurs qui tombent dans la même cellule. */
  dateValeur: string;
  sourceId: string | null;
  millesime: string | null;
  resultat: number | null;
  objectif: number | null;
};

/**
 * Assemble le diagnostic d'une démarche : le référentiel attendu et les valeurs
 * de la collectivité, servis ensemble pour que le front et le guard
 * `dossierComplet` appliquent la même règle au même objet.
 */
@Injectable()
export class DemarchePcaetDiagnosticService {
  private readonly logger = new Logger(DemarchePcaetDiagnosticService.name);

  constructor(
    private readonly repository: DemarchePcaetDiagnosticRepository,
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
    const [structureRows, topicYears, vulnerabilite] = await Promise.all([
      this.repository.listStructure(tx),
      this.repository.listTopicYears(demarcheId, tx),
      this.vulnerabiliteReadService.loadVulnerabilite(
        { demarcheId, collectiviteId },
        tx
      ),
    ]);

    const referentielIds = structureRows.flatMap((row) =>
      row.rowReferentielId === null ? [] : [row.rowReferentielId]
    );
    const valeurs = await this.listValeurs(collectiviteId, referentielIds, tx);

    return {
      topics: this.groupTopics(structureRows).map((topic) =>
        this.toTopic(topic, valeurs, topicYears, vulnerabilite)
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
        sources: [
          COLLECTIVITE_SOURCE_ID,
          PCAET_COLLECTIVITE_SOURCE_ID,
          ...REFERENCE_SOURCE_IDS,
        ],
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

    // La requête n'impose aucun ordre et plusieurs dates d'une même année
    // tombent dans la même cellule : sans tri, la valeur retenue — donc la
    // complétude — dépendrait de l'ordre rendu par PostgreSQL.
    return valeurs.sort(
      (a, b) =>
        a.dateValeur.localeCompare(b.dateValeur) ||
        (a.millesime ?? '').localeCompare(b.millesime ?? '') ||
        (a.sourceId ?? '').localeCompare(b.sourceId ?? '')
    );
  }

  /**
   * Recompose l'arbre topic → lignes depuis les lignes à plat, en deux passes :
   * les lignes de premier niveau d'abord, leurs enfants ensuite. L'ordre de la
   * requête ne garantit pas qu'un parent précède ses enfants.
   */
  private groupTopics(rows: DiagnosticStructureRow[]): TopicStructure[] {
    const topics: TopicStructure[] = [];
    const byTopicId = new Map<number, TopicStructure>();
    const rowsById = new Map<number, DemarchePcaetTopicRow>();
    const sansDefinition: string[] = [];

    const toLeaf = (row: DiagnosticStructureRow): DemarchePcaetTopicLeaf => ({
      label: row.rowLabel ?? '',
      referentielId: row.rowReferentielId,
      indicateurId: row.indicateurId,
      requis: row.requis ?? false,
    });

    for (const row of rows) {
      let topic = byTopicId.get(row.topicId);
      if (!topic) {
        topic = { header: row, rows: [], indicateurIds: [] };
        byTopicId.set(row.topicId, topic);
        topics.push(topic);
      }
      if (row.rowId === null || row.rowLabel === null) {
        continue;
      }
      if (row.rowReferentielId !== null && row.indicateurId === null) {
        sansDefinition.push(row.rowReferentielId);
      }
      if (row.indicateurId !== null) {
        topic.indicateurIds.push(row.indicateurId);
      }
      if (row.parentId === null) {
        const topicRow: DemarchePcaetTopicRow = { ...toLeaf(row), rows: [] };
        rowsById.set(row.rowId, topicRow);
        topic.rows.push(topicRow);
      }
    }

    const orphelines: number[] = [];
    for (const row of rows) {
      if (
        row.rowId === null ||
        row.rowLabel === null ||
        row.parentId === null
      ) {
        continue;
      }
      const parent = rowsById.get(row.parentId);
      if (!parent) {
        orphelines.push(row.rowId);
        continue;
      }
      parent.rows.push(toLeaf(row));
    }

    if (orphelines.length > 0) {
      this.logger.warn(
        `Diagnostic PCAET : ${
          orphelines.length
        } ligne(s) sans parent résolu (${orphelines.join(', ')})`
      );
    }

    if (sansDefinition.length > 0) {
      this.logger.warn(
        `Diagnostic PCAET : ${
          sansDefinition.length
        } ligne(s) sans définition d'indicateur (${sansDefinition.join(', ')})`
      );
    }

    return topics;
  }

  private toTopic(
    { header, rows, indicateurIds }: TopicStructure,
    valeurs: ValeurBrute[],
    topicYears: Map<number, DiagnosticTopicYears>,
    vulnerabilite: DemarchePcaetVulnerabilite
  ): DemarchePcaetTopic {
    const base = {
      code: header.code,
      label: header.label,
      icon: header.icon,
      kind: header.kind,
      groupLabel: header.topicGroupLabel,
      rowLabel: header.topicRowLabel,
      unit: header.unit,
      referentielId: header.topicReferentielId,
      horizons: header.horizons,
      rows,
    };

    if (header.kind !== DemarchePcaetTopicKindEnum.INDICATEURS) {
      return {
        ...base,
        referenceYear: null,
        extraYears: [],
        years: [],
        valeurs: [],
        vulnerabilite:
          header.kind === DemarchePcaetTopicKindEnum.VULNERABILITE
            ? vulnerabilite
            : null,
      };
    }

    const topicIndicateurIds = new Set(indicateurIds);
    const topicValeurs = valeurs.filter((valeur) =>
      topicIndicateurIds.has(valeur.indicateurId)
    );
    const saisies = topicValeurs.filter((valeur) => valeur.sourceId === null);

    const stored = topicYears.get(header.topicId);
    const referenceYear =
      stored?.referenceYear ??
      deriveReferenceYear({
        resultYears: saisies
          .filter((valeur) => valeur.resultat !== null)
          .map((valeur) => valeur.year),
        currentYear: new Date().getFullYear(),
      });
    const extraYears = normalizeExtraYears({
      extraYears: stored?.extraYears ?? [],
      referenceYear,
      horizons: header.horizons,
    });
    const years = buildTopicYears({
      referenceYear,
      horizons: header.horizons,
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

  /**
   * Une cellule par croisement ligne × année affichée : la saisie de la
   * collectivité et, à côté, ce que disent les sources de référence. Les
   * valeurs arrivent triées par date croissante : la plus récente de l'année
   * écrase les précédentes.
   */
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
