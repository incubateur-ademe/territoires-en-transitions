import ListCollectivitesService from '@/backend/collectivites/list-collectivites/list-collectivites.service';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { Test } from '@nestjs/testing';
import CollectivitesService from '../../collectivites/services/collectivites.service';
import SheetService from '../../utils/google-sheets/sheet.service';
import { ListDefinitionsService } from '../definitions/list-definitions/list-definitions.service';
import IndicateurSourcesService from '../sources/indicateur-sources.service';
import CrudValeursService from '../valeurs/crud-valeurs.service';
import { IndicateurValeur } from '../valeurs/indicateur-valeur.table';
import TrajectoiresDataService from './trajectoires-data.service';

describe('TrajectoiresDataService test', () => {
  let trajectoiresDataService: TrajectoiresDataService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [TrajectoiresDataService],
    })
      .useMocker((token) => {
        // Pour l'instant on ne mocke pas ces services précisemment
        if (
          token === CollectivitesService ||
          token === IndicateurSourcesService ||
          token === ListDefinitionsService ||
          token === CrudValeursService ||
          token === PermissionService ||
          token === ListCollectivitesService
        ) {
          return {};
        } else if (token === SheetService) {
          return {
            getFileData: vi.fn().mockResolvedValue(null),
          };
        }
      })
      .compile();

    trajectoiresDataService = moduleRef.get(TrajectoiresDataService);
  });

  describe('getInterpolationValeur', () => {
    it('Interpolation possible, cas de valeurs égales', async () => {
      const indicateurValeurs: IndicateurValeur[] = [
        {
          id: 640644,
          collectiviteId: 3894,
          indicateurId: 304,
          dateValeur: '2013-01-01',
          metadonneeId: 4,
          resultat: 9.94,
          resultatCommentaire: null,
          objectif: null,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: '2024-07-18T13:25:40.776Z',
          createdAt: '2024-07-10T13:44:47.193Z',
          modifiedBy: null,
          createdBy: null,
          calculAuto: false,
          calculAutoIdentifiantsManquants: null,
        },
        {
          id: 640645,
          collectiviteId: 3894,
          indicateurId: 304,
          dateValeur: '2014-01-01',
          metadonneeId: 4,
          resultat: 7.39,
          resultatCommentaire: null,
          objectif: null,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: '2024-07-18T13:25:40.776Z',
          createdAt: '2024-07-10T13:44:47.193Z',
          modifiedBy: null,
          createdBy: null,
          calculAuto: false,
          calculAutoIdentifiantsManquants: null,
        },
        {
          id: 640646,
          collectiviteId: 3894,
          indicateurId: 304,
          dateValeur: '2016-01-01',
          metadonneeId: 4,
          resultat: 7.47,
          resultatCommentaire: null,
          objectif: null,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: '2024-07-18T13:25:40.776Z',
          createdAt: '2024-07-10T13:44:47.193Z',
          modifiedBy: null,
          createdBy: null,
          calculAuto: false,
          calculAutoIdentifiantsManquants: null,
        },
        {
          id: 640647,
          collectiviteId: 3894,
          indicateurId: 304,
          dateValeur: '2017-01-01',
          metadonneeId: 4,
          resultat: 7.48,
          resultatCommentaire: null,
          objectif: null,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: '2024-07-18T13:25:40.776Z',
          createdAt: '2024-07-10T13:44:47.193Z',
          modifiedBy: null,
          createdBy: null,
          calculAuto: false,
          calculAutoIdentifiantsManquants: null,
        },
      ];

      const interpolationResultat =
        trajectoiresDataService.getInterpolationValeur(indicateurValeurs);
      const interpolationResultatAttendu: {
        valeur: number | null;
        date_min: string | null;
        date_max: string | null;
      } = {
        valeur: 7.43,
        date_min: '2014-01-01',
        date_max: '2016-01-01',
      };

      expect(interpolationResultat).toEqual(interpolationResultatAttendu);
    });

    it('Interpolation possible, cas de valeurs égales', async () => {
      const indicateurValeurs: IndicateurValeur[] = [
        {
          id: 651923,
          collectiviteId: 3903,
          indicateurId: 360,
          dateValeur: '2005-01-01',
          metadonneeId: 5,
          resultat: 0,
          resultatCommentaire: null,
          objectif: null,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: '2024-07-10T13:44:47.193Z',
          createdAt: '2024-07-10T13:44:47.193Z',
          modifiedBy: null,
          createdBy: null,
          calculAuto: false,
          calculAutoIdentifiantsManquants: null,
        },
        {
          id: 651924,
          collectiviteId: 3903,
          indicateurId: 360,
          dateValeur: '2017-01-01',
          metadonneeId: 5,
          resultat: 0,
          resultatCommentaire: null,
          objectif: null,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: '2024-07-10T13:44:47.193Z',
          createdAt: '2024-07-10T13:44:47.193Z',
          modifiedBy: null,
          createdBy: null,
          calculAuto: false,
          calculAutoIdentifiantsManquants: null,
        },
        {
          id: 651925,
          collectiviteId: 3903,
          indicateurId: 360,
          dateValeur: '2018-01-01',
          metadonneeId: 5,
          resultat: 0,
          resultatCommentaire: null,
          objectif: null,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: '2024-07-10T13:44:47.193Z',
          createdAt: '2024-07-10T13:44:47.193Z',
          modifiedBy: null,
          createdBy: null,
          calculAuto: false,
          calculAutoIdentifiantsManquants: null,
        },
      ];

      const interpolationResultat =
        trajectoiresDataService.getInterpolationValeur(indicateurValeurs);
      const interpolationResultatAttendu: {
        valeur: number | null;
        date_min: string | null;
        date_max: string | null;
      } = {
        valeur: 0,
        date_min: '2005-01-01',
        date_max: '2017-01-01',
      };

      expect(interpolationResultat).toEqual(interpolationResultatAttendu);
    });
  });

  describe('getClosestValeur', () => {
    it('Cas standard', async () => {
      const indicateurValeurs: IndicateurValeur[] = [
        {
          id: 640644,
          collectiviteId: 3894,
          indicateurId: 304,
          dateValeur: '2013-01-01',
          metadonneeId: 4,
          resultat: 9.94,
          resultatCommentaire: null,
          objectif: null,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: '2024-07-18T13:25:40.776Z',
          createdAt: '2024-07-10T13:44:47.193Z',
          modifiedBy: null,
          createdBy: null,
          calculAuto: false,
          calculAutoIdentifiantsManquants: null,
        },
        {
          id: 640645,
          collectiviteId: 3894,
          indicateurId: 304,
          dateValeur: '2014-01-01',
          metadonneeId: 4,
          resultat: 7.39,
          resultatCommentaire: null,
          objectif: null,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: '2024-07-18T13:25:40.776Z',
          createdAt: '2024-07-10T13:44:47.193Z',
          modifiedBy: null,
          createdBy: null,
          calculAuto: false,
          calculAutoIdentifiantsManquants: null,
        },
        {
          id: 640646,
          collectiviteId: 3894,
          indicateurId: 304,
          dateValeur: '2016-01-01',
          metadonneeId: 4,
          resultat: 7.47,
          resultatCommentaire: null,
          objectif: null,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: '2024-07-18T13:25:40.776Z',
          createdAt: '2024-07-10T13:44:47.193Z',
          modifiedBy: null,
          createdBy: null,
          calculAuto: false,
          calculAutoIdentifiantsManquants: null,
        },
        {
          id: 640647,
          collectiviteId: 3894,
          indicateurId: 304,
          dateValeur: '2017-01-01',
          metadonneeId: 4,
          resultat: 7.48,
          resultatCommentaire: null,
          objectif: null,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: '2024-07-18T13:25:40.776Z',
          createdAt: '2024-07-10T13:44:47.193Z',
          modifiedBy: null,
          createdBy: null,
          calculAuto: false,
          calculAutoIdentifiantsManquants: null,
        },
      ];

      const closestResultat =
        trajectoiresDataService.getClosestValeur(indicateurValeurs);
      const closestResultatAttendu: {
        valeur: number | null;
        date_min: string | null;
        date_max: string | null;
      } = {
        valeur: 7.39,
        date_min: '2014-01-01',
        date_max: '2014-01-01',
      };

      expect(closestResultat).toEqual(closestResultatAttendu);
    });
  });

  describe('extractSourceIdentifiantManquantsFromCommentaire', () => {
    it('Extraction nominale avec un identifiant manquant', async () => {
      const commentaire = 'Source: rare - Indicateurs manquants: cae_2.a';

      const sourceIdentifiantManquants =
        trajectoiresDataService.extractSourceIdentifiantManquantsFromCommentaire(
          commentaire
        );
      expect(sourceIdentifiantManquants).toEqual({
        sources: ['rare'],
        identifiants_referentiel_manquants: ['cae_2.a'],
      });
    });

    it('Extraction avec deux sources avec un identifiant manquant', async () => {
      const commentaire =
        "Sources des données d'entrée: rare,aldo - Indicateurs manquants: cae_2.a";

      const sourceIdentifiantManquants =
        trajectoiresDataService.extractSourceIdentifiantManquantsFromCommentaire(
          commentaire
        );
      expect(sourceIdentifiantManquants).toEqual({
        sources: ['rare', 'aldo'],
        identifiants_referentiel_manquants: ['cae_2.a'],
      });
    });

    it('Extraction la source saisie manuelle et un identifiant manquant', async () => {
      const commentaire =
        "Sources des données d'entrée:   saisie manuelle   - Indicateurs manquants: cae_2.a";

      const sourceIdentifiantManquants =
        trajectoiresDataService.extractSourceIdentifiantManquantsFromCommentaire(
          commentaire
        );
      expect(sourceIdentifiantManquants).toEqual({
        sources: ['collectivite'],
        identifiants_referentiel_manquants: ['cae_2.a'],
      });
    });

    it('Extraction nominale avec deux identifiant manquant', async () => {
      const commentaire =
        'Source: collectivite   - Indicateurs manquants: cae_2.a, cae_63.c';

      const sourceIdentifiantManquants =
        trajectoiresDataService.extractSourceIdentifiantManquantsFromCommentaire(
          commentaire
        );
      expect(sourceIdentifiantManquants).toEqual({
        sources: ['collectivite'],
        identifiants_referentiel_manquants: ['cae_2.a', 'cae_63.c'],
      });
    });

    it('Extraction nominale sans identifiant manquant', async () => {
      const commentaire = 'Source: collectivite   - Indicateurs manquants:  ';

      const sourceIdentifiantManquants =
        trajectoiresDataService.extractSourceIdentifiantManquantsFromCommentaire(
          commentaire
        );
      expect(sourceIdentifiantManquants).toEqual({
        sources: ['collectivite'],
        identifiants_referentiel_manquants: [],
      });
    });

    it('Extraction nominale sans identifiant manquant 2', async () => {
      const commentaire = 'Source: collectivite - Indicateurs manquants: ';

      const sourceIdentifiantManquants =
        trajectoiresDataService.extractSourceIdentifiantManquantsFromCommentaire(
          commentaire
        );
      expect(sourceIdentifiantManquants).toEqual({
        sources: ['collectivite'],
        identifiants_referentiel_manquants: [],
      });
    });

    it('Extraction nominale sans identifiant manquant (non spécifié)', async () => {
      const commentaire = 'Source: collectivite';

      const sourceIdentifiantManquants =
        trajectoiresDataService.extractSourceIdentifiantManquantsFromCommentaire(
          commentaire
        );
      expect(sourceIdentifiantManquants).toEqual({
        sources: ['collectivite'],
        identifiants_referentiel_manquants: [],
      });
    });

    it('Pas de maching', async () => {
      const commentaire = 'Sourc: collectivite';

      const sourceIdentifiantManquants =
        trajectoiresDataService.extractSourceIdentifiantManquantsFromCommentaire(
          commentaire
        );
      expect(sourceIdentifiantManquants).toEqual(null);
    });
  });
});
