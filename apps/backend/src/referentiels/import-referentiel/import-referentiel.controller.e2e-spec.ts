import { INestApplication } from '@nestjs/common';
import { referentielDefinitionTable } from '@tet/backend/referentiels/models/referentiel-definition.table';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { findActionById, ReferentielIdEnum } from '@tet/domain/referentiels';
import { eq } from 'drizzle-orm';
import { default as request } from 'supertest';
import { ReferentielResponse } from '../get-referentiel/get-referentiel.service';

describe('import-referentiel.controller.e2e-spec', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp({
      // simule l'env. de prod pour tester que l'on ne peut pas écraser la version courante
      mockProdEnv: true,
    });
    databaseService = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  }, 30000);

  it(`Import du referentiel ECI depuis le spreadsheet`, async () => {
    // Reset the version
    await databaseService.db
      .update(referentielDefinitionTable)
      .set({ version: '0.0.1' })
      .where(eq(referentielDefinitionTable.id, ReferentielIdEnum.ECI));

    const importPath = `/referentiels/${ReferentielIdEnum.ECI}/import`;
    // Import a first time the definitions
    const response = await request(app.getHttpServer())
      .get(importPath)
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(200);
    const getReferentielResponse: ReferentielResponse = response.body;
    expect(getReferentielResponse.itemsTree.actionId).toBe(
      ReferentielIdEnum.ECI
    );

    // Check that the preuves are imported
    const foundAction = findActionById(
      getReferentielResponse.itemsTree,
      'eci_1.3.1'
    );
    expect(foundAction.preuves).toHaveLength(1);
    expect(foundAction.preuves?.[0]?.preuveId).toBe('indicateurs_eci');

    // Import a second time the definitions, must be refused because the version is the same
    const errorResponse = await request(app.getHttpServer())
      .get(importPath)
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(422);

    expect(errorResponse.body).toMatchObject({
      error: 'Unprocessable Entity',
      message: expect.stringMatching(
        /please add a new version in the changelog/i
      ),
      statusCode: 422,
    });
  }, 20000);

  it(`Import du referentiel CAE depuis le spreadsheet`, async () => {
    // Reset the version
    await databaseService.db
      .update(referentielDefinitionTable)
      .set({ version: '0.0.1' })
      .where(eq(referentielDefinitionTable.id, ReferentielIdEnum.CAE));

    const importPath = `/referentiels/${ReferentielIdEnum.CAE}/import`;
    // Import a first time the definitions
    const response = await request(app.getHttpServer())
      .get(importPath)
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(200);
    const getReferentielResponse: ReferentielResponse = response.body;
    expect(getReferentielResponse.itemsTree.actionId).toBe(
      ReferentielIdEnum.CAE
    );

    // Check that the preuves are imported
    const foundAction = findActionById(
      getReferentielResponse.itemsTree,
      'cae_1.1.3.2'
    );
    expect(foundAction.preuves).toHaveLength(1);
    expect(foundAction.preuves?.[0]?.preuveId).toBe('etude_vulnerabiliteCC');

    // Import a second time the definitions, must be refused because the version is the same
    const errorResponse = await request(app.getHttpServer())
      .get(importPath)
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(422);

    expect(errorResponse.body).toMatchObject({
      error: 'Unprocessable Entity',
      message: expect.stringMatching(
        /please add a new version in the changelog/i
      ),
      statusCode: 422,
    });
  }, 20000);

  it(`Import du referentiel TE depuis le spreadsheet avec test du lock`, async () => {
    // Reset the version
    await databaseService.db
      .update(referentielDefinitionTable)
      .set({ version: '0.0.1' })
      .where(eq(referentielDefinitionTable.id, ReferentielIdEnum.TE));

    const importPath = `/referentiels/${ReferentielIdEnum.TE}/import`;
    // Import a first time the definitions
    const response = await request(app.getHttpServer())
      .get(importPath)
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(200);
    const getReferentielResponse: ReferentielResponse = response.body;
    expect(getReferentielResponse.itemsTree.actionId).toBe(
      ReferentielIdEnum.TE
    );

    // Lock it
    await databaseService.db
      .update(referentielDefinitionTable)
      .set({ locked: true })
      .where(eq(referentielDefinitionTable.id, ReferentielIdEnum.TE));

    onTestFinished(async () => {
      await databaseService.db
        .update(referentielDefinitionTable)
        .set({ locked: false })
        .where(eq(referentielDefinitionTable.id, ReferentielIdEnum.TE));
    });

    // Import a second time the definitions, must be refused because of the lock
    const errorResponse = await request(app.getHttpServer())
      .get(importPath)
      .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
      .expect(403);

    expect(errorResponse.body).toMatchObject({
      error: 'Forbidden',
      message: expect.stringMatching(
        /Le référentiel te est verrouillé, veuillez demander à un administrateur de le déverrouiller/i
      ),
      statusCode: 403,
    });
  }, 20000);
});
