import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ListCollectiviteIndicateursRepository } from '@tet/backend/indicateurs/indicateurs/list-collectivite-indicateurs/list-collectivite-indicateurs.repository';
import { GetAxeService } from '@tet/backend/plans/axes/get-axe/get-axe.service';
import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
import { FicheAnnexesService } from '@tet/backend/plans/fiches/fiche-annexes/fiche-annexes.service';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { ActionDefinitionsRepository } from '@tet/backend/referentiels/action-definitions/action-definitions.repository';
import { buildRequesterUser } from '@tet/backend/users/models/auth.models';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { FicheExportPayloadService } from './fiche-export-payload.service';

const ficheId = 12;
const user = buildRequesterUser('00000000-0000-0000-0000-000000000001');

const fiche = {
  id: ficheId,
  collectiviteId: 3,
  axes: [],
  indicateurs: [{ id: 40 }],
  mesures: [],
  budgets: [],
  notes: null,
};

const toPayloadService = ({
  getFicheById = vi.fn().mockResolvedValue(success(fiche)),
  listCollectiviteIndicateurs = vi.fn().mockResolvedValue(success([])),
  listByActionIds = vi.fn().mockResolvedValue([]),
}: {
  getFicheById?: ReturnType<typeof vi.fn>;
  listCollectiviteIndicateurs?: ReturnType<typeof vi.fn>;
  listByActionIds?: ReturnType<typeof vi.fn>;
}) => {
  const listFichesService = {
    getFicheById,
    listFichesQuery: vi.fn().mockResolvedValue({ data: [] }),
  } as unknown as ListFichesService;
  const getAxeService = {} as unknown as GetAxeService;
  const actionDefinitionsRepository = {
    listByActionIds,
  } as unknown as ActionDefinitionsRepository;
  const listCollectiviteIndicateursRepository = {
    listCollectiviteIndicateurs,
  } as unknown as ListCollectiviteIndicateursRepository;
  const fichePermissions = {} as unknown as FicheActionPermissionsService;
  const ficheAnnexesService = {
    listForFiches: vi.fn().mockResolvedValue(success([])),
  } as unknown as FicheAnnexesService;
  return new FicheExportPayloadService(
    listFichesService,
    getAxeService,
    actionDefinitionsRepository,
    listCollectiviteIndicateursRepository,
    fichePermissions,
    ficheAnnexesService
  );
};

describe('FicheExportPayloadService.buildFicheExportPayload', () => {
  it('retourne le failure du chargement des indicateurs avec sa cause', async () => {
    const cause = new Error('lecture des indicateurs impossible');

    const result = await toPayloadService({
      listCollectiviteIndicateurs: vi
        .fn()
        .mockResolvedValue(failure('DATABASE_ERROR', cause)),
    }).buildFicheExportPayload({ ficheId, user });

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
  });

  it('convertit une exception du chargement des actions liées en DATABASE_ERROR', async () => {
    const cause = new Error('connexion perdue');

    const result = await toPayloadService({
      listByActionIds: vi.fn().mockRejectedValue(cause),
    }).buildFicheExportPayload({ ficheId, user });

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
  });

  it('convertit une exception imprévue de la lecture de la fiche en DATABASE_ERROR', async () => {
    const cause = new Error('lecture de la fiche impossible');

    const result = await toPayloadService({
      getFicheById: vi.fn().mockRejectedValue(cause),
    }).buildFicheExportPayload({ ficheId, user });

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
  });

  it('retourne FICHE_UNAVAILABLE quand la lecture de la fiche est refusée', async () => {
    const result = await toPayloadService({
      getFicheById: vi.fn().mockRejectedValue(new ForbiddenException()),
    }).buildFicheExportPayload({ ficheId, user });

    expect(result).toEqual(
      failure(
        'FICHE_UNAVAILABLE',
        new Error(`Fiche ${ficheId} : Accès refusé sur la fiche ${ficheId}`)
      )
    );
  });

  it('retourne FICHE_UNAVAILABLE avec la raison quand la fiche est introuvable', async () => {
    const result = await toPayloadService({
      getFicheById: vi
        .fn()
        .mockResolvedValue(
          failure(`Aucune action trouvée avec l'id ${ficheId}`)
        ),
    }).buildFicheExportPayload({ ficheId, user });

    expect(result).toEqual(
      failure(
        'FICHE_UNAVAILABLE',
        new Error(
          `Fiche ${ficheId} : Aucune action trouvée avec l'id ${ficheId}`
        )
      )
    );
  });

  it('convertit une exception HTTP typée levée dans le chargement en DATABASE_ERROR', async () => {
    const cause = new NotFoundException('Referentiel definition te not found');

    const result = await toPayloadService({
      listByActionIds: vi.fn().mockRejectedValue(cause),
    }).buildFicheExportPayload({ ficheId, user });

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
  });

  it('marque un indicateur prédéfini comme non perso', async () => {
    const result = await toPayloadService({
      listCollectiviteIndicateurs: vi
        .fn()
        .mockResolvedValue(
          success([{ id: 40, identifiantReferentiel: 'cae_1.a' }])
        ),
    }).buildFicheExportPayload({ ficheId, user });

    expect(result).toMatchObject({
      success: true,
      data: {
        indicateursListe: [{ id: 40, estPerso: false, hasOpenData: false }],
      },
    });
  });

  it('marque un indicateur de la collectivité comme perso', async () => {
    const result = await toPayloadService({
      listCollectiviteIndicateurs: vi.fn().mockResolvedValue(
        success([
          {
            id: 41,
            collectiviteId: 3,
            identifiantReferentiel: null,
            groupementId: null,
          },
        ])
      ),
    }).buildFicheExportPayload({ ficheId, user });

    expect(result).toMatchObject({
      success: true,
      data: {
        indicateursListe: [{ id: 41, estPerso: true, hasOpenData: false }],
      },
    });
  });
});
