import {
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import {
  CalculTrajectoireRequestClass,
  TrajectoiresController,
} from './trajectoires.controller';
import TrajectoiresSpreadsheetService from './trajectoires-spreadsheet.service';
import TrajectoiresXlsxService from './trajectoires-xlsx.service';

const request = { collectiviteId: 3 } as CalculTrajectoireRequestClass;
const tokenInfo = {} as AuthenticatedUser;

const toController = (calculeTrajectoireSnbc: ReturnType<typeof vi.fn>) =>
  new TrajectoiresController(
    {} as unknown as TrajectoiresXlsxService,
    { calculeTrajectoireSnbc } as unknown as TrajectoiresSpreadsheetService
  );

describe('TrajectoiresController.calculeTrajectoireSnbc', () => {
  it("retire l'identifiant du spreadsheet de la réponse", async () => {
    const response = await toController(
      vi
        .fn()
        .mockResolvedValue(
          success({ spreadsheetId: 'feuille', mode: 'DONNEES_EN_BDD' })
        )
    ).calculeTrajectoireSnbc(request, tokenInfo);

    expect(response).toEqual({ mode: 'DONNEES_EN_BDD' });
  });

  it("garde le statut et le message d'une exception HTTP d'un service non migré", async () => {
    const cause = new NotFoundException('Collectivité introuvable');

    await expect(
      toController(
        vi.fn().mockResolvedValue(failure('DATABASE_ERROR', cause))
      ).calculeTrajectoireSnbc(request, tokenInfo)
    ).rejects.toBe(cause);
  });

  it('répond 422 avec le message de la cause pour une trajectoire non calculable', async () => {
    await expect(
      toController(
        vi
          .fn()
          .mockResolvedValue(
            failure(
              'UNPROCESSABLE_TRAJECTOIRE',
              new Error('Données manquantes')
            )
          )
      ).calculeTrajectoireSnbc(request, tokenInfo)
    ).rejects.toEqual(new UnprocessableEntityException('Données manquantes'));
  });

  it('répond 500 avec le message de la cause pour une erreur serveur explicite', async () => {
    await expect(
      toController(
        vi
          .fn()
          .mockResolvedValue(
            failure('SERVER_ERROR', new Error('Le SIREN est invalide'))
          )
      ).calculeTrajectoireSnbc(request, tokenInfo)
    ).rejects.toEqual(
      new InternalServerErrorException('Le SIREN est invalide')
    );
  });
});
