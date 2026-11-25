import { NotFoundException } from '@nestjs/common';
import ListCollectivitesService from '@tet/backend/collectivites/list-collectivites/list-collectivites.service';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import SheetService from '@tet/backend/utils/google-sheets/sheet.service';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { failure, success } from '@tet/backend/utils/result.type';
import { VerificationTrajectoireStatus } from '@tet/domain/indicateurs';
import { describe, expect, it, vi } from 'vitest';
import { ListIndicateursPredefinisRepository } from '../indicateurs/list-indicateurs-predefinis/list-indicateurs-predefinis.repository';
import ManageIndicateurValeursService from '../valeurs/manage-indicateur-valeurs/manage-indicateur-valeurs.service';
import { CalculTrajectoireRequestType } from './calcul-trajectoire.request';
import TrajectoiresDataService from './trajectoires-data.service';
import TrajectoiresSpreadsheetService from './trajectoires-spreadsheet.service';
import { UNSUPPORTED_MESSAGES } from './verification-trajectoire.rules';

const request = { collectiviteId: 3 } as CalculTrajectoireRequestType;
const tokenInfo = {} as AuthUser;
const epci = { id: 3, nom: 'EPCI', siren: '200000172' };

const donneesEntree = {
  emissionsGes: { valeurs: [], identifiantsReferentielManquants: [] },
  sequestrations: { valeurs: [], identifiantsReferentielManquants: [] },
  consommationsFinales: { valeurs: [], identifiantsReferentielManquants: [] },
  sources: [],
};

const toService = ({
  spreadsheetId = 'spreadsheet',
  folderId = 'dossier',
  verification = { status: VerificationTrajectoireStatus.DEJA_CALCULE },
  getTrajectoireIndicateursMetadonnees = vi.fn().mockResolvedValue({ id: 1 }),
  listIndicateursPredefinis = vi.fn(),
  upsertIndicateurValeurs = vi.fn(),
}: {
  spreadsheetId?: string;
  folderId?: string;
  verification?: Record<string, unknown>;
  getTrajectoireIndicateursMetadonnees?: ReturnType<typeof vi.fn>;
  listIndicateursPredefinis?: ReturnType<typeof vi.fn>;
  upsertIndicateurValeurs?: ReturnType<typeof vi.fn>;
} = {}) => {
  const configService = {
    get: vi.fn((key: string) =>
      key === 'TRAJECTOIRE_SNBC_SHEET_ID' ? spreadsheetId : folderId
    ),
  } as unknown as ConfigurationService;
  const listIndicateursPredefinisRepository = {
    listIndicateursPredefinis,
  } as unknown as ListIndicateursPredefinisRepository;
  const valeursService = {
    upsertIndicateurValeurs,
  } as unknown as ManageIndicateurValeursService;
  const trajectoiresDataService = {
    getTrajectoireIndicateursMetadonnees,
    verificationDonneesSnbc: vi.fn().mockResolvedValue(verification),
    getObjectifCommentaire: vi.fn().mockReturnValue(null),
    SNBC_TRAJECTOIRE_RESULTAT_IDENTIFIANTS_REFERENTIEL: ['cae_1.a'],
  } as unknown as TrajectoiresDataService;
  const sheetService = {
    getFileIdByName: vi.fn().mockResolvedValue('fichier'),
    deleteFile: vi.fn().mockResolvedValue(undefined),
    copyFile: vi.fn().mockResolvedValue('nouvelle-feuille'),
    overwriteRawDataToSheet: vi.fn().mockResolvedValue(undefined),
    getRawDataFromSheet: vi.fn().mockResolvedValue({ data: [] }),
  } as unknown as SheetService;
  const listCollectivitesService = {
    getCollectiviteByAnyIdentifiant: vi.fn().mockResolvedValue(epci),
  } as unknown as ListCollectivitesService;
  return new TrajectoiresSpreadsheetService(
    configService,
    listIndicateursPredefinisRepository,
    valeursService,
    trajectoiresDataService,
    sheetService,
    listCollectivitesService
  );
};

describe('TrajectoiresSpreadsheetService.calculeTrajectoireSnbc', () => {
  it("retourne SERVER_ERROR quand l'identifiant de la feuille de calcul est manquant", async () => {
    const result = await toService({
      spreadsheetId: '',
    }).calculeTrajectoireSnbc(request, tokenInfo);

    expect(result).toEqual(
      failure(
        'SERVER_ERROR',
        new Error(
          "L'identifiant de la feuille de calcul pour les trajectoires SNBC est manquante"
        )
      )
    );
  });

  it("retourne SERVER_ERROR quand l'identifiant du dossier est manquant", async () => {
    const result = await toService({ folderId: '' }).calculeTrajectoireSnbc(
      request,
      tokenInfo
    );

    expect(result).toEqual(
      failure(
        'SERVER_ERROR',
        new Error(
          "L'identifiant du dossier pour le stockage des trajectoires SNBC calculées est manquant"
        )
      )
    );
  });

  it('retourne UNPROCESSABLE_TRAJECTOIRE quand les droits sont insuffisants', async () => {
    const result = await toService({
      verification: {
        status: VerificationTrajectoireStatus.DROITS_INSUFFISANTS,
      },
    }).calculeTrajectoireSnbc(request, tokenInfo);

    expect(result).toEqual(
      failure(
        'UNPROCESSABLE_TRAJECTOIRE',
        new Error('Droits insuffisants pour calculer la trajectoire SNBC')
      )
    );
  });

  it('retourne UNPROCESSABLE_TRAJECTOIRE avec le message du statut non supporté', async () => {
    const result = await toService({
      verification: {
        status: VerificationTrajectoireStatus.COMMUNE_NON_SUPPORTEE,
      },
    }).calculeTrajectoireSnbc(request, tokenInfo);

    expect(result).toEqual(
      failure(
        'UNPROCESSABLE_TRAJECTOIRE',
        new Error(
          UNSUPPORTED_MESSAGES[
            VerificationTrajectoireStatus.COMMUNE_NON_SUPPORTEE
          ]
        )
      )
    );
  });

  it('retourne UNPROCESSABLE_TRAJECTOIRE en listant les indicateurs sans valeur', async () => {
    const result = await toService({
      verification: {
        status: VerificationTrajectoireStatus.DONNEES_MANQUANTES,
        donneesEntree: {
          emissionsGes: { identifiantsReferentielManquants: ['cae_1.c'] },
          consommationsFinales: {
            identifiantsReferentielManquants: ['cae_2.e'],
          },
        },
      },
    }).calculeTrajectoireSnbc(request, tokenInfo);

    expect(result).toEqual(
      failure(
        'UNPROCESSABLE_TRAJECTOIRE',
        new Error(
          "Les indicateurs suivants n'ont pas de valeur pour l'année 2015 ou avec une interpolation possible : cae_1.c, cae_2.e, impossible de calculer la trajectoire SNBC."
        )
      )
    );
  });

  it("retourne SERVER_ERROR quand l'EPCI est absent du résultat de vérification déjà calculé", async () => {
    const result = await toService({
      verification: { status: VerificationTrajectoireStatus.DEJA_CALCULE },
    }).calculeTrajectoireSnbc(request, tokenInfo);

    expect(result).toEqual(
      failure(
        'SERVER_ERROR',
        new Error('EPCI information is missing from verification result')
      )
    );
  });

  it('propage en DATABASE_ERROR la cause de la lecture des indicateurs déjà calculés', async () => {
    const cause = new Error('lecture impossible');

    const result = await toService({
      verification: {
        status: VerificationTrajectoireStatus.DEJA_CALCULE,
        epci,
        valeurs: [],
      },
      listIndicateursPredefinis: vi
        .fn()
        .mockResolvedValue(failure('DATABASE_ERROR', cause)),
    }).calculeTrajectoireSnbc(request, tokenInfo);

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
  });

  it('convertit une exception imprévue en DATABASE_ERROR avec sa cause', async () => {
    const cause = new Error('connexion perdue');

    const result = await toService({
      getTrajectoireIndicateursMetadonnees: vi.fn().mockRejectedValue(cause),
    }).calculeTrajectoireSnbc(request, tokenInfo);

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
  });

  it("garde l'exception HTTP d'un service non migré comme cause du DATABASE_ERROR", async () => {
    const cause = new NotFoundException('Collectivité introuvable');

    const result = await toService({
      getTrajectoireIndicateursMetadonnees: vi.fn().mockRejectedValue(cause),
    }).calculeTrajectoireSnbc(request, tokenInfo);

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
  });
  it('retourne le DATABASE_ERROR de la lecture des indicateurs lors d’un calcul complet', async () => {
    const cause = new Error('lecture impossible');
    const upsertIndicateurValeurs = vi.fn();

    const result = await toService({
      verification: {
        status: VerificationTrajectoireStatus.PRET_A_CALCULER,
        donneesEntree,
      },
      listIndicateursPredefinis: vi
        .fn()
        .mockResolvedValue(failure('DATABASE_ERROR', cause)),
      upsertIndicateurValeurs,
    }).calculeTrajectoireSnbc(request, tokenInfo);

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
    expect(upsertIndicateurValeurs).not.toHaveBeenCalled();
  });

  it('retourne un DATABASE_ERROR qui garde la cause de l’échec d’écriture des valeurs', async () => {
    const cause = new Error('écriture impossible');

    const result = await toService({
      verification: {
        status: VerificationTrajectoireStatus.PRET_A_CALCULER,
        donneesEntree,
      },
      listIndicateursPredefinis: vi.fn().mockResolvedValue(success([])),
      upsertIndicateurValeurs: vi
        .fn()
        .mockResolvedValue(failure('DATABASE_ERROR', cause)),
    }).calculeTrajectoireSnbc(request, tokenInfo);

    expect(result).toEqual(failure('DATABASE_ERROR', cause));
  });
});
