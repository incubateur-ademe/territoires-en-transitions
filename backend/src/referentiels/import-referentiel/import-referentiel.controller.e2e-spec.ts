import { ReferentielIdEnum } from '@/backend/referentiels/index-domain';
import { referentielDefinitionTable } from '@/backend/referentiels/models/referentiel-definition.table';
import { getTestApp, getTestDatabase } from '@/backend/test';
import { DatabaseService } from '@/backend/utils';
import { INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { default as request } from 'supertest';
import { ReferentielResponse } from '../get-referentiel/get-referentiel.service';

describe('import-referentiel.controller.e2e-spec', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    databaseService = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  it(`Import du referentiel te depuis le spreadsheet`, async () => {
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
});
