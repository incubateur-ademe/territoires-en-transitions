import { INestApplication } from '@nestjs/common';
import { addTestCollectivite } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import ValeursReferenceService from './valeurs-reference.service';

describe('ValeursReferenceService', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let service: ValeursReferenceService;
  let collectiviteId: number;

  const definition = {
    id: 0,
    identifiantReferentiel: null,
    exprCible: 'si identite(sinoe, rural_disperse) alors 2 sinon 3',
    exprSeuil: 'si identite(sinoe, urbain) alors 1 sinon 0',
    libelleCibleSeuil: null,
    unite: '',
  };

  const setSinoeId = (sinoeId: string | null) =>
    db.db
      .update(collectiviteTable)
      .set({ sinoeId })
      .where(eq(collectiviteTable.id, collectiviteId));

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    service = app.get(ValeursReferenceService);

    const { collectivite, cleanup } = await addTestCollectivite(db);
    collectiviteId = collectivite.id;

    return async () => {
      await cleanup();
      await app.close();
    };
  });

  describe('identite(sinoe, …) dans exprSeuil et exprCible', () => {
    it('évalue la typologie SINOE de la collectivité', async () => {
      await setSinoeId('urbain');

      const valeurs = await service.getValeursReferenceForDefinition({
        collectiviteId,
        definition,
      });

      expect(valeurs).toMatchObject({ seuil: 1, cible: 3 });
    });

    it('ne répond à aucune typologie pour une collectivité sans typologie', async () => {
      await setSinoeId(null);

      const valeurs = await service.getValeursReferenceForDefinition({
        collectiviteId,
        definition,
      });

      expect(valeurs).toMatchObject({ seuil: 0, cible: 3 });
    });
  });
});
