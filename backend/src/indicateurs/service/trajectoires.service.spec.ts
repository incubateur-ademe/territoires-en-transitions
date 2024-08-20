import { Test } from '@nestjs/testing';
import { DateTime } from 'luxon';
import CollectivitesService from '../../collectivites/services/collectivites.service';
import SheetService from '../../spreadsheets/services/sheet.service';
import { IndicateurValeurType } from '../models/indicateur.models';
import IndicateursService from './indicateurs.service';
import IndicateurSourcesService from './indicateurSources.service';
import TrajectoiresService from './trajectoires.service';

describe('TrajectoiresService', () => {
  let trajectoiresService: TrajectoiresService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TrajectoiresService],
    })
      .useMocker((token) => {
        // Pour l'instant on ne mocke pas ces services précisemment
        if (
          token === CollectivitesService ||
          IndicateurSourcesService ||
          IndicateursService ||
          SheetService
        ) {
          return {};
        }
      })
      .compile();

    trajectoiresService = moduleRef.get(TrajectoiresService);
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
        trajectoiresService.getInterpolationValeur(indicateurValeurs);
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
        trajectoiresService.getInterpolationValeur(indicateurValeurs);
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
});
