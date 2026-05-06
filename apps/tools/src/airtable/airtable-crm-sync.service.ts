import { Injectable, Logger } from '@nestjs/common';
import { membreTable } from '@tet/backend/collectivites/membres/membre.table';
import { collectiviteBanaticTypeTable } from '@tet/backend/collectivites/shared/models/collectivite-banatic-type.table';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { departementTable } from '@tet/backend/collectivites/shared/models/imports-departement.table';
import { regionTable } from '@tet/backend/collectivites/shared/models/imports-region.table';
import { cotTable } from '@tet/backend/referentiels/labellisations/cot.table';
import { labellisationTable } from '@tet/backend/referentiels/labellisations/labellisation.table';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { and, desc, eq, ne, sql } from 'drizzle-orm';
import { ToolsAutomationApiConfigurationType } from '../config/configuration.model';
import ConfigurationService from '../config/configuration.service';
import { DatabaseService } from '../utils/database/database.service';
import { AirtableRowInsertDto } from './airtable-row-insert.dto';
import { AirtableService } from './airtable.service';

type CrmSyncRow = Record<string, unknown>;

interface CrmSyncJobDescriptor {
  // Nom de la vue Postgres source. Sert d'identifiant logique du descripteur
  // (loggué, utilisé dans les tests) ; côté SQL, c'est aussi la table par
  // défaut sur laquelle on lit (`select * from <viewName>`), à moins qu'un
  // fetcher dédié ne soit branché dans `syncTable`. Doit être un identifiant
  // statique — on l'injecte via sql.raw, donc jamais d'entrée externe ici.
  readonly viewName: string;
  // Clé de la table Airtable cible dans la configuration (env var).
  readonly tableIdConfigKey: keyof ToolsAutomationApiConfigurationType;
  // Champs utilisés comme clé de fusion par l'upsert Airtable. Doivent tous
  // être non nuls et stables d'un run à l'autre. Quand le type côté JS doit
  // être ajusté pour matcher le type du champ Airtable (par ex. number → string
  // pour un champ Text), on le fait explicitement via `transformRow`.
  readonly mergeFields: readonly string[];
  // Expression cron pour le déclenchement du job. Conserve les fenêtres
  // d'origine de pg_cron pour faciliter le rollback.
  readonly cronExpression: string;
  // Coercion optionnelle ligne par ligne. Utilisé quand le pilote pg sérialise
  // un type d'une manière qu'Airtable n'accepte pas tel quel (numerics renvoyés
  // comme string), ou pour synthétiser une clé de fusion non nulle.
  readonly transformRow?: (row: CrmSyncRow) => CrmSyncRow;
}

// `crm_plans.type` est nullable pour la branche catch-all de l'union. Airtable
// upsert avec un champ de fusion null insère sans matcher, ce qui dupliquerait
// la ligne catch-all à chaque run. On synthétise une clé non nulle stable.
const synthesizeCrmPlansKey = (row: CrmSyncRow): CrmSyncRow => ({
  ...row,
  type:
    row['type'] != null && row['type'] !== '' ? String(row['type']) : 'no-type',
});

// `crm_indicateurs.id` est int4 côté Postgres (donc JS number), mais le
// champ correspondant sur la table Airtable est typé Text. On le stringifie
// explicitement avant l'upsert pour que la comparaison stricte de
// fieldsToMergeOn matche les enregistrements existants.
const stringifyCrmIndicateursId = (row: CrmSyncRow): CrmSyncRow => ({
  ...row,
  id: row['id'] != null ? String(row['id']) : null,
});

// node-postgres sérialise bigint (oid 20) et numeric (oid 1700) en string par
// défaut pour préserver la précision. Airtable, lui, refuse une string dans un
// champ Number. On coerce les colonnes véritablement numériques côté Postgres
// (via les OIDs renvoyés dans `result.fields`) en JS number avant l'upsert ;
// les colonnes text restent strings (par ex. code_siren_insee, qui ressemble
// à un nombre mais doit rester une chaîne).
const POSTGRES_BIGINT_OID = 20;
const POSTGRES_NUMERIC_OID = 1700;

const coerceNumericColumns = (
  rows: CrmSyncRow[],
  fields: ReadonlyArray<{ name: string; dataTypeID: number }> | undefined,
  excludedColumns: ReadonlyArray<string>
): CrmSyncRow[] => {
  if (!fields?.length) {
    // En tests le mock peut omettre `fields` ; en prod node-postgres le
    // renvoie toujours. Si on ne sait pas typer les colonnes, on n'applique
    // pas la coercion plutôt que de risquer de transformer du texte.
    return rows;
  }
  const excluded = new Set(excludedColumns);
  // Les merge fields servent de clé de fusion à Airtable, qui matche par
  // égalité stricte sur la chaîne. Les flipper d'un type à l'autre romprait
  // l'identité côté Airtable, même si la colonne Postgres sous-jacente est
  // numérique. On les laisse tels quels.
  const numericColumnNames = fields
    .filter(
      (f) =>
        (f.dataTypeID === POSTGRES_BIGINT_OID ||
          f.dataTypeID === POSTGRES_NUMERIC_OID) &&
        !excluded.has(f.name)
    )
    .map((f) => f.name);
  if (numericColumnNames.length === 0) {
    return rows;
  }
  return rows.map((row) => {
    const coerced: CrmSyncRow = { ...row };
    for (const colName of numericColumnNames) {
      const value = coerced[colName];
      if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          coerced[colName] = parsed;
        }
      }
    }
    return coerced;
  });
};

// Les sept jobs de synchro CRM, dérivés des jobs pg_cron historiques (jobids
// 15, 16, 17, 19, 33, 34, 35). Cette constante est l'unique source de vérité
// pour la liste des tables, leur cadence et leur clé de fusion. Elle est
// consommée par cron.config.ts pour construire JOBS_CONFIG, et par
// CronConsumerService pour le dispatch.
export const CRM_SYNC_JOBS = {
  'crm-collectivites-sync': {
    viewName: 'crm_collectivites',
    tableIdConfigKey: 'AIRTABLE_CRM_COLLECTIVITES_TABLE_ID',
    mergeFields: ['collectivite_id'],
    cronExpression: '0 6 * * *',
  },
  'crm-personnes-sync': {
    viewName: 'crm_personnes',
    tableIdConfigKey: 'AIRTABLE_CRM_PERSONNES_TABLE_ID',
    mergeFields: ['user_id'],
    cronExpression: '5 6 * * *',
  },
  'crm-droits-sync': {
    viewName: 'crm_droits',
    tableIdConfigKey: 'AIRTABLE_CRM_DROITS_TABLE_ID',
    mergeFields: ['collectivite_id', 'user_id'],
    cronExpression: '10 6 * * *',
  },
  'crm-labellisations-sync': {
    viewName: 'crm_labellisations',
    tableIdConfigKey: 'AIRTABLE_CRM_LABELLISATIONS_TABLE_ID',
    mergeFields: ['id'],
    cronExpression: '15 6 * * *',
  },
  'crm-indicateurs-sync': {
    viewName: 'crm_indicateurs',
    tableIdConfigKey: 'AIRTABLE_CRM_INDICATEURS_TABLE_ID',
    mergeFields: ['id'],
    cronExpression: '25 6 * * *',
    transformRow: stringifyCrmIndicateursId,
  },
  'crm-plans-sync': {
    viewName: 'crm_plans',
    tableIdConfigKey: 'AIRTABLE_CRM_PLANS_TABLE_ID',
    mergeFields: ['type'],
    cronExpression: '30 6 * * *',
    transformRow: synthesizeCrmPlansKey,
  },
} as const satisfies Record<string, CrmSyncJobDescriptor>;

export type CrmSyncJobName = keyof typeof CRM_SYNC_JOBS;

export const isCrmSyncJobName = (name: string): name is CrmSyncJobName =>
  name in CRM_SYNC_JOBS;

@Injectable()
export class AirtableCrmSyncService {
  private readonly logger = new Logger(AirtableCrmSyncService.name);

  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly airtableService: AirtableService,
    private readonly databaseService: DatabaseService
  ) {}

  /**
   * Lit l'intégralité d'une vue CRM Postgres puis upsert chaque ligne dans la
   * table Airtable correspondante via `AirtableService.insertRecords` avec
   * `performUpsert`. Remplace l'ancienne edge function `crm_sync` qui poussait
   * les données en CSV vers l'endpoint Airtable `/sync/<id>`.
   *
   * Les lignes sont matérialisées en mémoire avant la phase d'upsert pour ne
   * pas tenir une transaction Postgres ouverte pendant les minutes que peut
   * prendre l'envoi à Airtable.
   */
  async syncTable(jobName: CrmSyncJobName): Promise<{ inserted: number }> {
    const descriptor = CRM_SYNC_JOBS[jobName];
    // La synchro CRM cible la base d'import partagée (déjà connue de l'API
    // pour d'autres usages), pas la base CRM à proprement parler.
    const baseId = this.configurationService.get('AIRTABLE_IMPORT_DATABASE_ID');
    const tableId = this.configurationService.get(descriptor.tableIdConfigKey);

    const startedAt = Date.now();
    this.logger.log(
      `${jobName}: lecture de la vue ${descriptor.viewName} en cours`
    );

    // Pour les jobs migrés vers Drizzle, on bypass la vue Postgres et on lit
    // directement les tables sources. Cela évite le prédicat
    // `where is_service_role()` de la vue, qui ne se comporte pas comme
    // attendu en contexte worker (cf. policies élargies à service_role dans
    // data_layer/sqitch/deploy/automatisation/crm_sync_service_role_read.sql).
    let rows: CrmSyncRow[];
    switch (jobName) {
      case 'crm-collectivites-sync':
        rows = await this.fetchCollectivitesRows();
        break;
      case 'crm-droits-sync':
        rows = await this.fetchDroitsRows();
        break;
      case 'crm-labellisations-sync':
        rows = await this.fetchLabellisationsRows();
        break;
      default:
        rows = await this.fetchViewRows(descriptor);
        break;
    }

    this.logger.log(
      `${jobName}: ${rows.length} ligne(s) lue(s) depuis ${descriptor.viewName}`
    );

    if (rows.length === 0) {
      // Plutôt que d'écraser Airtable avec un envoi vide (qui ne le ferait pas
      // de toute façon avec insertRecords, mais qui est suspect en soi), on
      // alerte et on s'arrête. Une vue qui retourne 0 ligne est généralement
      // un signal de panne en amont (refresh manqué, role mal positionné, etc).
      this.logger.warn(
        `${jobName}: la vue ${descriptor.viewName} a retourné 0 ligne, upsert ignoré`
      );
      return { inserted: 0 };
    }

    const transformRow =
      'transformRow' in descriptor ? descriptor.transformRow : undefined;
    const records: AirtableRowInsertDto<CrmSyncRow>[] = rows.map((row) => ({
      fields: transformRow ? transformRow(row) : row,
    }));

    this.logger.log(
      `${jobName}: upsert de ${records.length} enregistrement(s) vers Airtable`
    );

    const upserted = await this.airtableService.insertRecords(
      baseId,
      tableId,
      records,
      { fieldsToMergeOn: [...descriptor.mergeFields] }
    );

    const elapsedMs = Date.now() - startedAt;
    this.logger.log(
      `${jobName}: ${upserted.length} enregistrement(s) upserted en ${elapsedMs}ms`
    );

    return { inserted: upserted.length };
  }

  /**
   * Lit la vue CRM telle quelle (`select * from <viewName>`). Conservé pour
   * les jobs où la vue se comporte correctement en contexte worker
   * (collectivites, personnes, indicateurs, plans).
   */
  private async fetchViewRows(
    descriptor: CrmSyncJobDescriptor
  ): Promise<CrmSyncRow[]> {
    return this.databaseService.withServiceRole()(async (tx) => {
      const result = await tx.execute<CrmSyncRow>(
        sql.raw(`select * from ${descriptor.viewName}`)
      );
      return coerceNumericColumns(
        result.rows,
        result.fields,
        descriptor.mergeFields
      );
    });
  }

  /**
   * Reproduit la vue `crm_collectivites` (cf.
   * data_layer/sqitch/deploy/automatisation/crm@v4.2.0.sql) directement sur
   * les tables sources, sans transiter par la vue matérialisée
   * `stats.collectivite` ni le prédicat `where is_service_role()`.
   *
   * Inline les colonnes dérivées de `stats.collectivite` (type_collectivite,
   * nature_collectivite, code_siren_insee, region/departement name+code,
   * population_totale) en repartant de `collectivite` + ses joints
   * (`collectivite_banatic_type`, `imports.region`, `imports.departement`).
   * Les deux jointures latérales `ll_cae` / `ll_eci` ramènent la dernière
   * labellisation par référentiel.
   */
  private async fetchCollectivitesRows(): Promise<CrmSyncRow[]> {
    const db = this.databaseService.db;

    const lastLabellisation = (referentiel: 'cae' | 'eci') =>
      db
        .select({
          etoiles: labellisationTable.etoiles,
          score_programme: labellisationTable.scoreProgramme,
          score_realise: labellisationTable.scoreRealise,
          annee: labellisationTable.annee,
        })
        .from(labellisationTable)
        .where(
          and(
            eq(labellisationTable.collectiviteId, collectiviteTable.id),
            eq(labellisationTable.referentiel, referentiel)
          )
        )
        .orderBy(desc(labellisationTable.annee))
        .limit(1)
        .as(`ll_${referentiel}`);

    const llCae = lastLabellisation('cae');
    const llEci = lastLabellisation('eci');

    const rows = await db
      .select({
        key: sql<string>`${collectiviteTable.nom} || ' (' || ${collectiviteTable.id} || ')'`,
        collectivite_id: collectiviteTable.id,
        nom: collectiviteTable.nom,
        // Reproduit la dérivation de stats.collectivite : un EPCI dont la
        // sous-catégorie banatic est un syndicat est reclassé en 'syndicat',
        // sinon 'EPCI' ; les autres types passent tels quels.
        type_collectivite: sql<string>`case
          when ${collectiviteTable.type} = 'epci' then
            case
              when ${collectiviteBanaticTypeTable.type} in ('Syndicat mixte', 'Syndicat de communes') then 'syndicat'
              else 'EPCI'
            end
          else ${collectiviteTable.type}
        end`,
        nature_collectivite: sql<string>`coalesce(${collectiviteTable.natureInsee}, ${collectiviteTable.type})`,
        code_siren_insee: sql<string>`coalesce(${collectiviteTable.communeCode}, ${collectiviteTable.siren}, '')`,
        region_name: sql<string>`coalesce(${regionTable.libelle}, '')`,
        // Airtable veut un Number ici. `regionTable.code` est un varchar(2)
        // ("11", "84", …) ; on le caste côté Postgres et on laisse passer
        // null (left join sans match) plutôt que de retomber sur '' qui ne
        // se parse pas.
        region_code: sql<number | null>`nullif(${regionTable.code}, '')::int`,
        departement_name: sql<string>`coalesce(${departementTable.libelle}, '')`,
        departement_code: sql<string>`coalesce(${departementTable.code}, '')`,
        population_totale: sql<number>`coalesce(${collectiviteTable.population}, 0)`,
        // Le champ Airtable n'accepte pas un booléen JS (records API renvoie
        // "Cannot parse value for field cot"). On envoie 't'/'f' comme le
        // faisait l'ancien path CSV (sérialisation Postgres par défaut).
        cot: sql<string>`case when coalesce(${cotTable.actif}, false) then 't' else 'f' end`,
        // Les champs `lab_*` Airtable n'acceptent pas un Number JS — ils sont
        // typés Single Select / Text côté Airtable. On stringifie tout ce
        // bloc côté Postgres (null reste null pour les collectivités sans
        // labellisation).

        lab_cae_etoiles: sql<string | null>`(${llCae.etoiles})::text`,
        lab_cae_programme: sql<string | null>`(${llCae.score_programme})::text`,
        lab_cae_realise: sql<string | null>`(${llCae.score_realise})::text`,
        lab_cae_annee: sql<string | null>`(${llCae.annee})::text`,
        lab_eci_etoiles: sql<string | null>`(${llEci.etoiles})::text`,
        lab_eci_programme: sql<string | null>`(${llEci.score_programme})::text`,
        lab_eci_realise: sql<string | null>`(${llEci.score_realise})::text`,
        lab_eci_annee: sql<string | null>`(${llEci.annee})::text`,
      })
      .from(collectiviteTable)
      // Cast text→int implicite côté Postgres : `nature_insee` est typé text
      // mais la vue d'origine fait `c.nature_insee = t.id` (serial) sans
      // coercion explicite. On reproduit ce comportement via sql template
      // pour ne pas forcer un eq() typé Drizzle qui refuserait la comparaison.
      .leftJoin(
        collectiviteBanaticTypeTable,
        sql`${collectiviteTable.natureInsee} = ${collectiviteBanaticTypeTable.id}`
      )
      .leftJoin(
        departementTable,
        eq(collectiviteTable.departementCode, departementTable.code)
      )
      .leftJoin(regionTable, eq(departementTable.regionCode, regionTable.code))
      .leftJoin(cotTable, eq(cotTable.collectiviteId, collectiviteTable.id))
      .leftJoinLateral(llCae, sql`true`)
      .leftJoinLateral(llEci, sql`true`)
      .where(ne(collectiviteTable.type, 'test'));

    return rows as unknown as CrmSyncRow[];
  }

  /**
   * Reproduit la jointure de la vue `crm_labellisations` (cf.
   * data_layer/sqitch/deploy/automatisation/crm@v2.37.0.sql) directement sur
   * les tables sources, sans le prédicat `where is_service_role()` qui
   * retourne 0 ligne en contexte worker dans cet env Supabase.
   */
  private async fetchLabellisationsRows(): Promise<CrmSyncRow[]> {
    const rows = await this.databaseService.db
      .select({
        id: labellisationTable.id,
        collectivite_key: sql<string>`${collectiviteTable.nom} || ' (' || ${collectiviteTable.id} || ')'`,
        referentiel: labellisationTable.referentiel,
        obtenue_le: labellisationTable.obtenueLe,
        annee: labellisationTable.annee,
        etoiles: labellisationTable.etoiles,
        score_realise: labellisationTable.scoreRealise,
        score_programme: labellisationTable.scoreProgramme,
      })
      .from(collectiviteTable)
      .innerJoin(
        labellisationTable,
        eq(labellisationTable.collectiviteId, collectiviteTable.id)
      )
      .orderBy(collectiviteTable.nom, desc(labellisationTable.obtenueLe));
    return rows as unknown as CrmSyncRow[];
  }

  /**
   * Reproduit la jointure de la vue `crm_droits` (cf.
   * data_layer/sqitch/deploy/automatisation/crm@v2.36.0.sql), sans le
   * prédicat `where is_service_role()` qui retourne 0 ligne en contexte
   * worker dans cet env Supabase. Filtre sur active = true comme la vue.
   */
  private async fetchDroitsRows(): Promise<CrmSyncRow[]> {
    const rows = await this.databaseService.db
      .select({
        key: sql<string>`${utilisateurCollectiviteAccessTable.collectiviteId} || ' ' || ${utilisateurCollectiviteAccessTable.userId}`,
        user_id: utilisateurCollectiviteAccessTable.userId,
        user_key: sql<string>`${dcpTable.prenom} || ' ' || ${dcpTable.nom}`,
        collectivite_id: utilisateurCollectiviteAccessTable.collectiviteId,
        collectivite_key: sql<string>`${collectiviteTable.nom} || ' (' || ${collectiviteTable.id} || ')'`,
        niveau_acces: utilisateurCollectiviteAccessTable.role,
        fonction: membreTable.fonction,
        details_fonction: membreTable.detailsFonction,
        // Multiple Select côté Airtable : on envoie le tableau natif
        // (Drizzle renvoie un `string[] | null`). L'ancienne edge function
        // CSV faisait `array_to_string(..., ',')` mais le path CSV/sync
        // d'Airtable auto-splittait — le records API, lui, refuse une
        // string là où il attend un array.
        champ_intervention: membreTable.champIntervention,
      })
      .from(utilisateurCollectiviteAccessTable)
      .innerJoin(
        collectiviteTable,
        eq(
          utilisateurCollectiviteAccessTable.collectiviteId,
          collectiviteTable.id
        )
      )
      .innerJoin(
        dcpTable,
        eq(dcpTable.id, utilisateurCollectiviteAccessTable.userId)
      )
      .leftJoin(
        membreTable,
        and(
          eq(membreTable.userId, utilisateurCollectiviteAccessTable.userId),
          eq(
            membreTable.collectiviteId,
            utilisateurCollectiviteAccessTable.collectiviteId
          )
        )
      )
      .where(
        and(
          eq(utilisateurCollectiviteAccessTable.isActive, true),
          ne(collectiviteTable.type, 'test')
        )
      )
      .orderBy(utilisateurCollectiviteAccessTable.collectiviteId);
    return rows as unknown as CrmSyncRow[];
  }
}
