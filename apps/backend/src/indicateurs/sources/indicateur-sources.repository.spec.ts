import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { drizzle } from 'drizzle-orm/node-postgres';
import { IndicateurSourcesRepository } from './indicateur-sources.repository';

describe('IndicateurSourcesRepository', () => {
  it('utilise la transaction fournie pour partager le snapshot des métadonnées', async () => {
    const metadonnees = [{ id: 1 }];
    const from = vi.fn().mockResolvedValue(metadonnees);
    const select = vi.fn(() => ({ from }));
    const baseSelect = vi.fn();
    const repository = new IndicateurSourcesRepository({
      db: { select: baseSelect },
    } as unknown as DatabaseService);
    const tx = { select } as unknown as Transaction;

    await expect(repository.listMetadonnees(tx)).resolves.toBe(metadonnees);
    expect(select).toHaveBeenCalledOnce();
    expect(baseSelect).not.toHaveBeenCalled();
  });

  it('borne les sources disponibles aux valeurs renseignées de la collectivité et de l’indicateur', () => {
    const repository = new IndicateurSourcesRepository({
      db: drizzle.mock(),
    } as unknown as DatabaseService);

    const query = repository.listAvailableSources({
      collectiviteId: 42,
      indicateurId: 7,
    });
    const compiled = query.toSQL();

    expect(compiled.sql).toContain('"metadonnee_id" is not null');
    expect(compiled.sql).toContain('"collectivite_id" =');
    expect(compiled.sql).toContain('"indicateur_id" =');
    expect(compiled.sql).toContain('"resultat" is not null');
    expect(compiled.sql).toContain('"objectif" is not null');
    expect(compiled.params).toEqual([42, 7]);
  });
});
