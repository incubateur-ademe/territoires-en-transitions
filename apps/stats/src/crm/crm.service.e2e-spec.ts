import { INestApplication } from '@nestjs/common';
import CrmService from './crm.service';
import { getTestApp, getTestDatabase } from '../../test';
import { DatabaseService } from '../utils/database/database.service';
import { collectiviteTable } from '@/backend/collectivites/shared/models/collectivite.table';

describe('Test CRM', () => {
  let app: INestApplication;
  let crmService : CrmService;
  let databaseService : DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();

    crmService = app.get(CrmService);
    databaseService = await getTestDatabase(app);
  });

  test('test', async() => {
    // Test minimal
    expect('test').not.toBeNull();

    // Test l'accès à la BD et aux tables du backend
    const result = await databaseService.db
      .select()
      .from(collectiviteTable);
    expect(result).not.toBeNull();
    expect(result.length).toBeGreaterThan(0);

    // Test l'accès à Posthog
    const resultpost = await crmService.getViews();
    console.log(resultpost);
    expect(resultpost).not.toBeNull();
  });

});
