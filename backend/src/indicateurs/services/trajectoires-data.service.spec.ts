import { Test } from '@nestjs/testing';
import { DateTime } from 'luxon';
import { AuthService } from '../../auth/services/auth.service';
import CollectivitesService from '../../collectivites/services/collectivites.service';
import SheetService from '../../spreadsheets/services/sheet.service';
import { IndicateurValeurType } from '../models/indicateur.models';
import IndicateursService from './indicateurs.service';
import IndicateurSourcesService from './indicateurSources.service';
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
          token === IndicateursService ||
          token === AuthService
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
      const indicateurValeurs: IndicateurValeurType[] = [
        {
          id: 640644,
          collectivite_id: 3894,
          indicateur_id: 304,
          date_valeur: '2013-01-01',
          metadonnee_id: 4,
          resultat: 9.94,
          resultat_commentaire: null,
          objectif: null,
          objectif_commentaire: null,
          estimation: null,
          modified_at: DateTime.fromISO('2024-07-18T13:25:40.776Z').toJSDate(),
          created_at: DateTime.fromISO('2024-07-10T13:44:47.193Z').toJSDate(),
          modified_by: null,
          created_by: null,
        },
        {
          id: 640645,
          collectivite_id: 3894,
          indicateur_id: 304,
          date_valeur: '2014-01-01',
          metadonnee_id: 4,
          resultat: 7.39,
          resultat_commentaire: null,
          objectif: null,
          objectif_commentaire: null,
          estimation: null,
          modified_at: DateTime.fromISO('2024-07-18T13:25:40.776Z').toJSDate(),
          created_at: DateTime.fromISO('2024-07-10T13:44:47.193Z').toJSDate(),
          modified_by: null,
          created_by: null,
        },
        {
          id: 640646,
          collectivite_id: 3894,
          indicateur_id: 304,
          date_valeur: '2016-01-01',
          metadonnee_id: 4,
          resultat: 7.47,
          resultat_commentaire: null,
          objectif: null,
          objectif_commentaire: null,
          estimation: null,
          modified_at: DateTime.fromISO('2024-07-18T13:25:40.776Z').toJSDate(),
          created_at: DateTime.fromISO('2024-07-10T13:44:47.193Z').toJSDate(),
          modified_by: null,
          created_by: null,
        },
        {
          id: 640647,
          collectivite_id: 3894,
          indicateur_id: 304,
          date_valeur: '2017-01-01',
          metadonnee_id: 4,
          resultat: 7.48,
          resultat_commentaire: null,
          objectif: null,
          objectif_commentaire: null,
          estimation: null,
          modified_at: DateTime.fromISO('2024-07-18T13:25:40.776Z').toJSDate(),
          created_at: DateTime.fromISO('2024-07-10T13:44:47.193Z').toJSDate(),
          modified_by: null,
          created_by: null,
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
      const indicateurValeurs: IndicateurValeurType[] = [
        {
          id: 651923,
          collectivite_id: 3903,
          indicateur_id: 360,
          date_valeur: '2005-01-01',
          metadonnee_id: 5,
          resultat: 0,
          resultat_commentaire: null,
          objectif: null,
          objectif_commentaire: null,
          estimation: null,
          modified_at: DateTime.fromISO('2024-07-10T13:44:47.193Z').toJSDate(),
          created_at: DateTime.fromISO('2024-07-10T13:44:47.193Z').toJSDate(),
          modified_by: null,
          created_by: null,
        },
        {
          id: 651924,
          collectivite_id: 3903,
          indicateur_id: 360,
          date_valeur: '2017-01-01',
          metadonnee_id: 5,
          resultat: 0,
          resultat_commentaire: null,
          objectif: null,
          objectif_commentaire: null,
          estimation: null,
          modified_at: DateTime.fromISO('2024-07-10T13:44:47.193Z').toJSDate(),
          created_at: DateTime.fromISO('2024-07-10T13:44:47.193Z').toJSDate(),
          modified_by: null,
          created_by: null,
        },
        {
          id: 651925,
          collectivite_id: 3903,
          indicateur_id: 360,
          date_valeur: '2018-01-01',
          metadonnee_id: 5,
          resultat: 0,
          resultat_commentaire: null,
          objectif: null,
          objectif_commentaire: null,
          estimation: null,
          modified_at: DateTime.fromISO('2024-07-10T13:44:47.193Z').toJSDate(),
          created_at: DateTime.fromISO('2024-07-10T13:44:47.193Z').toJSDate(),
          modified_by: null,
          created_by: null,
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

  describe('extractSourceIdentifiantManquantsFromCommentaire', () => {
    it('Extraction nominale avec un identifiant manquant', async () => {
      const commentaire = 'Source: rare - Indicateurs manquants: cae_2.a';

      const sourceIdentifiantManquants =
        trajectoiresDataService.extractSourceIdentifiantManquantsFromCommentaire(
          commentaire
        );
      expect(sourceIdentifiantManquants).toEqual({
        source: 'rare',
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
        source: 'collectivite',
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
        source: 'collectivite',
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
        source: 'collectivite',
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
        source: 'collectivite',
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
