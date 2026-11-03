import { InternalServerErrorException } from '@nestjs/common';
import { failure, success } from '@tet/backend/utils/result.type';
import { ListIndicateursService } from './list-indicateurs.service';

const input = {
  collectiviteId: 1,
  filters: {},
  queryOptions: { page: 1, limit: 10 },
} as never;

const makeService = (listIndicateurs: ReturnType<typeof vi.fn>) =>
  new ListIndicateursService({ listIndicateurs } as never, {} as never);

describe('ListIndicateursService.listIndicateurs', () => {
  it('retire le compteur de chaque ligne et pagine le résultat', async () => {
    const service = makeService(
      vi.fn().mockResolvedValue(
        success([
          { id: 1, count: 25 },
          { id: 2, count: 25 },
        ])
      )
    );

    await expect(service.listIndicateurs(input)).resolves.toEqual({
      data: [{ id: 1 }, { id: 2 }],
      count: 25,
      page: 1,
      pageSize: 10,
      pageCount: 3,
    });
  });

  it('lève une erreur serveur portant la cause quand la nature est incohérente', async () => {
    const cause = new Error(
      'Indicateur 7 : nature incohérente (PERSO_WITH_GROUPEMENT)'
    );
    const service = makeService(
      vi.fn().mockResolvedValue(failure('DATABASE_ERROR', cause))
    );

    const read = service.listIndicateurs(input);

    await expect(read).rejects.toBeInstanceOf(InternalServerErrorException);
    await expect(read).rejects.toMatchObject({
      message: cause.message,
      cause,
    });
  });
});
