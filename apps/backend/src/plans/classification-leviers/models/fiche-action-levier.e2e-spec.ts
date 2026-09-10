import { INestApplication } from '@nestjs/common';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import {
  categorieActionEnumValues,
  levierIdEnumValues,
} from '@tet/domain/shared';
import { sql } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Les types postgres du rattachement levier x categorie', () => {
  let app: INestApplication;
  let db: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  const readEnumLabels = async (typeName: string): Promise<string[]> => {
    const rows = await db.db.execute<{ label: string }>(
      sql`select e.enumlabel as label
          from pg_enum e
                 join pg_type t on t.oid = e.enumtypid
          where t.typname = ${typeName}
          order by e.enumsortorder`
    );
    return rows.rows.map((row) => row.label);
  };

  it("declarent les memes valeurs qu'en TypeScript, dans le meme ordre", async () => {
    expect({
      levierId: await readEnumLabels('levier_id'),
      levierCategorie: await readEnumLabels('levier_categorie'),
    }).toEqual({
      levierId: [...levierIdEnumValues],
      levierCategorie: [...categorieActionEnumValues],
    });
  });
});
