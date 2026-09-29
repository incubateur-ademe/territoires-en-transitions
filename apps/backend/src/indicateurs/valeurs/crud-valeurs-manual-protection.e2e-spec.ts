import { ConfigService } from '@nestjs/config';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { BackendConfigurationType } from '@tet/backend/utils/config/configuration.model';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  IndicateurValeurCreate,
  PCAET_COLLECTIVITE_SOURCE_ID,
} from '@tet/domain/indicateurs';
import { CollectiviteRole } from '@tet/domain/users';
import { randomUUID } from 'crypto';
import { eq, inArray, sql } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import { IndicateurDefinitionLockRepository } from '../definitions/indicateur-definition-lock.repository';
import { indicateurDefinitionTable } from '../definitions/indicateur-definition.table';
import { ListPlatformDefinitionsRepository } from '../definitions/list-platform-definitions/list-platform-definitions.repository';
import { indicateurSourceMetadonneeTable } from '../shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '../shared/models/indicateur-source.table';
import { IndicateurSourcesRepository } from '../sources/indicateur-sources.repository';
import IndicateurSourcesService from '../sources/indicateur-sources.service';
import { ComputeValeursRepository } from './compute-valeurs.repository';
import ComputeValeursService from './compute-valeurs.service';
import { CrudValeursRepository } from './crud-valeurs.repository';
import IndicateurExpressionService from './indicateur-expression.service';
import { IndicateurValeurLockRepository } from './indicateur-valeur-lock.repository';
import { indicateurValeurTable } from './indicateur-valeur.table';
import { LoadIndicateurCalculGraphService } from './load-indicateur-calcul-graph.service';

// Only PostgreSQL is needed: no application workers, imports or external services.
describe('Protection des observations manuelles avec métadonnée (PostgreSQL)', () => {
  let database: DatabaseService;
  let repository: CrudValeursRepository;
  let compute: ComputeValeursService;

  beforeAll(async () => {
    database = new DatabaseService(
      new ConfigurationService(
        new ConfigService<BackendConfigurationType, true>()
      )
    );
    await database.db
      .insert(indicateurSourceTable)
      .values({ id: PCAET_COLLECTIVITE_SOURCE_ID, libelle: 'Diagnostic PCAET' })
      .onConflictDoNothing();
    repository = new CrudValeursRepository(database);
    const expressions = new IndicateurExpressionService();
    const sources = new IndicateurSourcesRepository(database);
    compute = new ComputeValeursService(
      new ComputeValeursRepository(database),
      new LoadIndicateurCalculGraphService(
        new ListPlatformDefinitionsRepository(database),
        new IndicateurDefinitionLockRepository(),
        expressions
      ),
      {
        getAllIndicateurSourceMetadonnees: (tx?: Transaction) =>
          sources.listMetadonnees(tx),
      } as IndicateurSourcesService,
      expressions,
      new IndicateurValeurLockRepository()
    );
  });

  afterAll(async () => {
    await database?.onApplicationShutdown('manual-protection-test');
  });

  async function fixture() {
    const { collectivite, user, cleanup } = await addTestCollectiviteAndUser(
      database,
      { user: { role: CollectiviteRole.ADMIN } }
    );
    const prefix = `manual_${randomUUID().replaceAll('-', '')}`;
    const [metadonnee] = await database.db
      .insert(indicateurSourceMetadonneeTable)
      .values({
        sourceId: PCAET_COLLECTIVITE_SOURCE_ID,
        dateVersion: new Date().toISOString(),
        nomDonnees: prefix,
      })
      .returning();
    const definitions = await database.db
      .insert(indicateurDefinitionTable)
      .values([
        {
          identifiantReferentiel: `${prefix}_source`,
          titre: prefix,
          unite: 'u',
        },
        {
          identifiantReferentiel: `${prefix}_intermediaire`,
          titre: prefix,
          unite: 'u',
          valeurCalcule: `val(${prefix}_source) * 2`,
        },
        {
          identifiantReferentiel: `${prefix}_aval`,
          titre: prefix,
          unite: 'u',
          valeurCalcule: `val(${prefix}_intermediaire) * 3`,
        },
      ])
      .returning();
    onTestFinished(async () => {
      await database.db.delete(indicateurDefinitionTable).where(
        inArray(
          indicateurDefinitionTable.id,
          definitions.map(({ id }) => id)
        )
      );
      await database.db
        .delete(indicateurSourceMetadonneeTable)
        .where(eq(indicateurSourceMetadonneeTable.id, metadonnee.id));
      await cleanup();
    });
    const valeur: IndicateurValeurCreate = {
      collectiviteId: collectivite.id,
      indicateurId: definitions[1].id,
      dateValeur: '2025-01-01',
      periodicite: 'annuelle',
      metadonneeId: metadonnee.id,
      resultat: 0,
      objectif: null,
      resultatCommentaire: 'Résultat saisi dans le diagnostic PCAET',
      objectifCommentaire: 'Objectif volontairement vide',
      calculAuto: false,
      calculAutoIdentifiantsManquants: null,
      createdBy: user.id,
      modifiedBy: user.id,
    };
    return { valeur, definitions };
  }

  async function snapshot(id: number, tx?: Transaction) {
    const { rows } = await (tx ?? database.db).execute<{
      observation: Record<string, unknown>;
    }>(sql`
      SELECT to_jsonb(v) AS observation FROM public.indicateur_valeur v
      WHERE id = ${id}
    `);
    return rows[0]?.observation;
  }

  const manualCases = [false, null].flatMap((calculAuto) =>
    [
      { resultat: 0, objectif: null },
      { resultat: null, objectif: 0 },
      { resultat: 11, objectif: 17 },
    ].map((fields) => ({ calculAuto, ...fields }))
  );

  it.each(manualCases)(
    'préserve toute la ligne pour calculAuto=$calculAuto, résultat=$resultat, objectif=$objectif',
    async (fields) => {
      const { valeur } = await fixture();
      const [manual] = await repository.upsertValeursWithMetadata([
        { ...valeur, ...fields },
      ]);
      const before = await snapshot(manual.id);

      const written = await repository.upsertValeursWithMetadata([
        {
          ...valeur,
          resultat: 999,
          objectif: 888,
          resultatCommentaire: 'Calcul automatique',
          objectifCommentaire: null,
          calculAuto: true,
          calculAutoIdentifiantsManquants: ['source_absente'],
          modifiedBy: null,
        },
      ]);

      expect(written).toEqual([]);
      // Includes comments, provenance, creator/editor and timestamp precision.
      expect(await snapshot(manual.id)).toEqual(before);
    }
  );

  it('met à jour les calculs automatiques et permet ensuite une saisie manuelle', async () => {
    const { valeur } = await fixture();
    const [initial] = await repository.upsertValeursWithMetadata([
      { ...valeur, calculAuto: true, resultat: 2, objectif: 4 },
    ]);
    const [recomputed] = await repository.upsertValeursWithMetadata([
      { ...valeur, calculAuto: true, resultat: 3, objectif: 6 },
    ]);
    expect(recomputed).toMatchObject({
      id: initial.id,
      resultat: 3,
      objectif: 6,
      calculAuto: true,
    });

    const [manual] = await repository.upsertValeursWithMetadata([
      { ...valeur, resultat: 0, objectif: 9 },
    ]);
    expect(manual).toMatchObject({
      id: initial.id,
      resultat: 0,
      objectif: 9,
      calculAuto: false,
    });
    const [edited] = await repository.upsertValeursWithMetadata([
      {
        ...valeur,
        resultat: null,
        objectif: 0,
        objectifCommentaire: 'Saisie corrigée',
      },
    ]);
    expect(edited).toMatchObject({
      id: initial.id,
      resultat: null,
      objectif: 0,
      objectifCommentaire: 'Saisie corrigée',
      calculAuto: false,
    });
  });

  it('ne bloque pas les autres écritures automatiques dans le même lot', async () => {
    const { valeur } = await fixture();
    const [manual] = await repository.upsertValeursWithMetadata([valeur]);
    const before = await snapshot(manual.id);
    const written = await repository.upsertValeursWithMetadata([
      { ...valeur, calculAuto: true, resultat: 999 },
      { ...valeur, dateValeur: '2024-01-01', calculAuto: true, resultat: 12 },
    ]);
    expect(written).toHaveLength(1);
    expect(written[0]).toMatchObject({
      dateValeur: '2024-01-01',
      resultat: 12,
      calculAuto: true,
    });
    expect(await snapshot(manual.id)).toEqual(before);
  });

  it('réévalue la protection après une saisie manuelle concurrente', async () => {
    const { valeur } = await fixture();
    const [initial] = await repository.upsertValeursWithMetadata([
      { ...valeur, calculAuto: true, resultat: 10 },
    ]);
    let releaseManual!: () => void;
    const manualGate = new Promise<void>((resolve) => {
      releaseManual = resolve;
    });
    let manualReady!: (pid: number) => void;
    const manualStarted = new Promise<number>((resolve) => {
      manualReady = resolve;
    });
    let automaticReady!: (pid: number) => void;
    const automaticStarted = new Promise<number>((resolve) => {
      automaticReady = resolve;
    });
    let manualSnapshot: Record<string, unknown> | undefined;
    const manualWrite = database.db.transaction(async (tx) => {
      const { rows } = await tx.execute<{ pid: number }>(
        sql`SELECT pg_backend_pid() AS pid`
      );
      await repository.upsertValeursWithMetadata(
        [{ ...valeur, resultat: 0 }],
        tx
      );
      manualSnapshot = await snapshot(initial.id, tx);
      manualReady(rows[0].pid);
      await manualGate;
    });
    const manualPid = await manualStarted;
    const automaticWrite = database.db.transaction(async (tx) => {
      const { rows } = await tx.execute<{ pid: number }>(
        sql`SELECT pg_backend_pid() AS pid`
      );
      automaticReady(rows[0].pid);
      return repository.upsertValeursWithMetadata(
        [{ ...valeur, calculAuto: true, resultat: 999, objectif: 999 }],
        tx
      );
    });
    try {
      const automaticPid = await automaticStarted;
      // Observe the real database lock; a timer alone cannot prove a race happened.
      await vi.waitFor(
        async () => {
          const { rows } = await database.db.execute<{
            blockers: number[];
          }>(sql`
          SELECT pg_blocking_pids(${automaticPid}) AS blockers
        `);
          expect(rows[0].blockers).toContain(manualPid);
        },
        { timeout: 5000, interval: 20 }
      );
    } finally {
      releaseManual();
      await manualWrite;
    }
    expect(await automaticWrite).toEqual([]);
    expect(await snapshot(initial.id)).toEqual(manualSnapshot);
  });

  it('recalcule les dépendants depuis la valeur manuelle conservée', async () => {
    const { valeur, definitions } = await fixture();
    const [source, manual] = await repository.upsertValeursWithMetadata([
      {
        ...valeur,
        indicateurId: definitions[0].id,
        resultat: 10,
        objectif: 20,
      },
      { ...valeur, resultat: 7, objectif: 0 },
    ]);
    const before = await snapshot(manual.id);

    await database.db.transaction(async (tx) => {
      const calculated =
        await compute.recomputeCollectiviteCalculatedIndicateurValeurs(
          valeur.collectiviteId,
          definitions.slice(1).map(({ id }) => id),
          tx
        );
      expect(calculated.valeurIdsToDelete).toEqual([]);
      expect(calculated.valeursToUpsert).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            indicateurId: manual.indicateurId,
            resultat: 20,
            objectif: 40,
          }),
          expect.objectContaining({
            indicateurId: definitions[2].id,
            resultat: 21,
            objectif: 0,
          }),
        ])
      );
      const written = await repository.upsertValeursWithMetadata(
        calculated.valeursToUpsert,
        tx
      );
      expect(written).toHaveLength(1);
      expect(written[0]).toMatchObject({
        indicateurId: definitions[2].id,
        resultat: 21,
        objectif: 0,
      });
      // The normal propagation must not propagate a rejected automatic candidate.
      expect(
        await compute.updateCalculatedIndicateurValeurs(written, tx)
      ).toEqual([]);
      const refreshed = await repository.upsertValeursWithMetadata(
        [{ ...source, resultat: 50 }],
        tx
      );
      const candidates = await compute.updateCalculatedIndicateurValeurs(
        refreshed,
        tx
      );
      expect(candidates).toEqual([
        expect.objectContaining({
          indicateurId: manual.indicateurId,
          resultat: 100,
        }),
      ]);
      expect(
        await repository.upsertValeursWithMetadata(candidates, tx)
      ).toEqual([]);
    });

    expect(await snapshot(manual.id)).toEqual(before);
    const [downstream] = await database.db
      .select()
      .from(indicateurValeurTable)
      .where(eq(indicateurValeurTable.indicateurId, definitions[2].id));
    expect(downstream).toMatchObject({
      resultat: 21,
      objectif: 0,
      calculAuto: true,
      metadonneeId: valeur.metadonneeId,
    });
  });
});
