import { Test } from '@nestjs/testing';
import { DateTime } from 'luxon';
import DatabaseService from '../../common/services/database.service';
import {
  IndicateurAvecValeurs,
  IndicateurAvecValeursParSource,
  IndicateurDefinitionType,
  IndicateurSourceMetadonneeType,
  IndicateurValeurType,
} from '../models/indicateur.models';
import IndicateursService from './indicateurs.service';

describe('IndicateursService', () => {
  let indicateurService: IndicateursService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [IndicateursService],
    })
      .useMocker((token) => {
        if (token === DatabaseService) {
          return {};
        }
      })
      .compile();

    indicateurService = moduleRef.get(IndicateursService);
  });

  describe('groupeIndicateursValeursParIndicateur', () => {
    it('Groupe les valeurs par indicateur, trie par date croissante les valeurs', async () => {
      const indicateur1: IndicateurDefinitionType = {
        id: 456,
        groupement_id: null,
        collectivite_id: null,
        identifiant_referentiel: 'cae_1.c',
        titre: 'Emissions de gaz à effet de serre - résidentiel',
        titre_long: 'Emissions de gaz à effet de serre du secteur résidentiel',
        description: '',
        unite: 'teq CO2',
        borne_min: null,
        borne_max: null,
        participation_score: false,
        sans_valeur_utilisateur: false,
        valeur_calcule: null,
        modified_at: DateTime.fromISO('2024-08-12T12:07:14.638Z').toJSDate(),
        created_at: DateTime.fromISO('2024-08-12T12:07:14.638Z').toJSDate(),
        modified_by: null,
        created_by: null,
      };
      const indicateur2: IndicateurDefinitionType = {
        id: 457,
        groupement_id: null,
        collectivite_id: null,
        identifiant_referentiel: 'cae_1.d',
        titre: 'Emissions de gaz à effet de serre - tertiaire',
        titre_long: 'Emissions de gaz à effet de serre du secteur tertiaire',
        description: '',
        unite: 'teq CO2',
        borne_min: null,
        borne_max: null,
        participation_score: false,
        sans_valeur_utilisateur: false,
        valeur_calcule: null,
        modified_at: DateTime.fromISO('2024-08-12T12:07:14.638Z').toJSDate(),
        created_at: DateTime.fromISO('2024-08-12T12:07:14.638Z').toJSDate(),
        modified_by: null,
        created_by: null,
      };
      const indicateur3: IndicateurDefinitionType = {
        id: 458,
        groupement_id: null,
        collectivite_id: null,
        identifiant_referentiel: 'cae_1.e',
        titre: 'Emissions de gaz à effet de serre - transport routier',
        titre_long:
          'Emissions de gaz à effet de serre du secteur du transport routier',
        description: '',
        unite: 'teq CO2',
        borne_min: null,
        borne_max: null,
        participation_score: false,
        sans_valeur_utilisateur: false,
        valeur_calcule: null,
        modified_at: DateTime.fromISO('2024-08-12T12:07:14.638Z').toJSDate(),
        created_at: DateTime.fromISO('2024-08-12T12:07:14.638Z').toJSDate(),
        modified_by: null,
        created_by: null,
      };
      const indicateurDefinitions: IndicateurDefinitionType[] = [
        indicateur1,
        indicateur2,
        indicateur3,
      ];

      const indicateurValeurs: IndicateurValeurType[] = [
        {
          id: 10264,
          collectivite_id: 4936,
          indicateur_id: 456,
          date_valeur: '2016-01-01',
          metadonnee_id: 1,
          resultat: null,
          resultat_commentaire: null,
          objectif: 527.25,
          objectif_commentaire: null,
          estimation: null,
          modified_at: DateTime.fromISO('2024-08-14T14:10:18.891Z').toJSDate(),
          created_at: DateTime.fromISO('2024-08-14T14:10:18.891Z').toJSDate(),
          modified_by: null,
          created_by: null,
        },
        {
          id: 10263,
          collectivite_id: 4936,
          indicateur_id: 456,
          date_valeur: '2015-01-01',
          metadonnee_id: 1,
          resultat: null,
          resultat_commentaire: null,
          objectif: 513.79,
          objectif_commentaire: null,
          estimation: null,
          modified_at: DateTime.fromISO('2024-08-14T14:10:18.891Z').toJSDate(),
          created_at: DateTime.fromISO('2024-08-14T14:10:18.891Z').toJSDate(),
          modified_by: null,
          created_by: null,
        },
        {
          id: 10300,
          collectivite_id: 4936,
          indicateur_id: 457,
          date_valeur: '2016-01-01',
          metadonnee_id: 1,
          resultat: null,
          resultat_commentaire: null,
          objectif: 423.08,
          objectif_commentaire: null,
          estimation: null,
          modified_at: DateTime.fromISO('2024-08-14T14:10:18.891Z').toJSDate(),
          created_at: DateTime.fromISO('2024-08-14T14:10:18.891Z').toJSDate(),
          modified_by: null,
          created_by: null,
        },
      ];
      const indicateurValeursGroupees =
        indicateurService.groupeIndicateursValeursParIndicateur(
          indicateurValeurs,
          indicateurDefinitions,
        );
      const expectedIndicateurValeursGroupees: IndicateurAvecValeurs[] = [
        {
          definition: indicateur1,
          valeurs: [
            {
              date_valeur: '2015-01-01',
              id: 10263,
              objectif: 513.79,
            },
            {
              date_valeur: '2016-01-01',
              id: 10264,
              objectif: 527.25,
            },
          ],
        },
        {
          definition: indicateur2,
          valeurs: [
            {
              date_valeur: '2016-01-01',
              id: 10300,
              objectif: 423.08,
            },
          ],
        },
      ];

      expect(indicateurValeursGroupees).toEqual(
        expectedIndicateurValeursGroupees,
      );
    });
  });

  describe('groupeIndicateursValeursParIndicateurEtSource', () => {
    it('Groupe les valeurs par indicateur et par source, trie par date croissante les valeurs', async () => {
      const indicateur1: IndicateurDefinitionType = {
        id: 456,
        groupement_id: null,
        collectivite_id: null,
        identifiant_referentiel: 'cae_1.c',
        titre: 'Emissions de gaz à effet de serre - résidentiel',
        titre_long: 'Emissions de gaz à effet de serre du secteur résidentiel',
        description: '',
        unite: 'teq CO2',
        borne_min: null,
        borne_max: null,
        participation_score: false,
        sans_valeur_utilisateur: false,
        valeur_calcule: null,
        modified_at: DateTime.fromISO('2024-08-12T12:07:14.638Z').toJSDate(),
        created_at: DateTime.fromISO('2024-08-12T12:07:14.638Z').toJSDate(),
        modified_by: null,
        created_by: null,
      };
      const indicateur2: IndicateurDefinitionType = {
        id: 457,
        groupement_id: null,
        collectivite_id: null,
        identifiant_referentiel: 'cae_1.d',
        titre: 'Emissions de gaz à effet de serre - tertiaire',
        titre_long: 'Emissions de gaz à effet de serre du secteur tertiaire',
        description: '',
        unite: 'teq CO2',
        borne_min: null,
        borne_max: null,
        participation_score: false,
        sans_valeur_utilisateur: false,
        valeur_calcule: null,
        modified_at: DateTime.fromISO('2024-08-12T12:07:14.638Z').toJSDate(),
        created_at: DateTime.fromISO('2024-08-12T12:07:14.638Z').toJSDate(),
        modified_by: null,
        created_by: null,
      };
      const indicateur3: IndicateurDefinitionType = {
        id: 458,
        groupement_id: null,
        collectivite_id: null,
        identifiant_referentiel: 'cae_1.e',
        titre: 'Emissions de gaz à effet de serre - transport routier',
        titre_long:
          'Emissions de gaz à effet de serre du secteur du transport routier',
        description: '',
        unite: 'teq CO2',
        borne_min: null,
        borne_max: null,
        participation_score: false,
        sans_valeur_utilisateur: false,
        valeur_calcule: null,
        modified_at: DateTime.fromISO('2024-08-12T12:07:14.638Z').toJSDate(),
        created_at: DateTime.fromISO('2024-08-12T12:07:14.638Z').toJSDate(),
        modified_by: null,
        created_by: null,
      };
      const indicateurDefinitions: IndicateurDefinitionType[] = [
        indicateur1,
        indicateur2,
        indicateur3,
      ];

      const indicateurMetadonnees: IndicateurSourceMetadonneeType[] = [
        {
          id: 1,
          source_id: 'rare',
          date_version: DateTime.fromISO('2024-07-18T00:00:00.000Z').toJSDate(),
          nom_donnees: '',
          diffuseur: 'OREC',
          producteur: '',
          methodologie: 'Scope 1&2 (approche cadastrale)',
          limites: '',
        },
        {
          id: 2,
          source_id: 'snbc',
          date_version: DateTime.fromISO('2024-07-11T00:00:00.000Z').toJSDate(),
          nom_donnees: null,
          diffuseur: null,
          producteur: null,
          methodologie: null,
          limites: null,
        },
      ];

      const indicateurValeurs: IndicateurValeurType[] = [
        {
          id: 10264,
          collectivite_id: 4936,
          indicateur_id: 456,
          date_valeur: '2016-01-01',
          metadonnee_id: 1,
          resultat: null,
          resultat_commentaire: null,
          objectif: 527.25,
          objectif_commentaire: null,
          estimation: null,
          modified_at: DateTime.fromISO('2024-08-14T14:10:18.891Z').toJSDate(),
          created_at: DateTime.fromISO('2024-08-14T14:10:18.891Z').toJSDate(),
          modified_by: null,
          created_by: null,
        },
        {
          id: 10263,
          collectivite_id: 4936,
          indicateur_id: 456,
          date_valeur: '2015-01-01',
          metadonnee_id: 1,
          resultat: null,
          resultat_commentaire: null,
          objectif: 513.79,
          objectif_commentaire: null,
          estimation: null,
          modified_at: DateTime.fromISO('2024-08-14T14:10:18.891Z').toJSDate(),
          created_at: DateTime.fromISO('2024-08-14T14:10:18.891Z').toJSDate(),
          modified_by: null,
          created_by: null,
        },
        {
          id: 10264,
          collectivite_id: 4936,
          indicateur_id: 456,
          date_valeur: '2015-01-01',
          metadonnee_id: null,
          resultat: 625,
          resultat_commentaire: null,
          objectif: null,
          objectif_commentaire: null,
          estimation: null,
          modified_at: DateTime.fromISO('2024-08-14T14:10:18.891Z').toJSDate(),
          created_at: DateTime.fromISO('2024-08-14T14:10:18.891Z').toJSDate(),
          modified_by: null,
          created_by: null,
        },
        {
          id: 10300,
          collectivite_id: 4936,
          indicateur_id: 457,
          date_valeur: '2016-01-01',
          metadonnee_id: 3,
          resultat: null,
          resultat_commentaire: null,
          objectif: 423.08,
          objectif_commentaire: null,
          estimation: null,
          modified_at: DateTime.fromISO('2024-08-14T14:10:18.891Z').toJSDate(),
          created_at: DateTime.fromISO('2024-08-14T14:10:18.891Z').toJSDate(),
          modified_by: null,
          created_by: null,
        },
      ];
      const indicateurValeursGroupees =
        indicateurService.groupeIndicateursValeursParIndicateurEtSource(
          indicateurValeurs,
          indicateurDefinitions,
          indicateurMetadonnees,
        );
      const expectedIndicateurValeursGroupees: IndicateurAvecValeursParSource[] =
        [
          {
            definition: {
              id: 456,
              groupement_id: null,
              collectivite_id: null,
              identifiant_referentiel: 'cae_1.c',
              titre: 'Emissions de gaz à effet de serre - résidentiel',
              titre_long:
                'Emissions de gaz à effet de serre du secteur résidentiel',
              description: '',
              unite: 'teq CO2',
              borne_min: null,
              borne_max: null,
              participation_score: false,
              sans_valeur_utilisateur: false,
              valeur_calcule: null,
              modified_at: DateTime.fromISO(
                '2024-08-12T12:07:14.638Z',
              ).toJSDate(),
              created_at: DateTime.fromISO(
                '2024-08-12T12:07:14.638Z',
              ).toJSDate(),
              modified_by: null,
              created_by: null,
            },
            sources: {
              rare: {
                source: 'rare',
                metadonnees: [
                  {
                    id: 1,
                    source_id: 'rare',
                    date_version: DateTime.fromISO(
                      '2024-07-18T00:00:00.000Z',
                    ).toJSDate(),
                    nom_donnees: '',
                    diffuseur: 'OREC',
                    producteur: '',
                    methodologie: 'Scope 1&2 (approche cadastrale)',
                    limites: '',
                  },
                ],
                valeurs: [
                  {
                    id: 10263,
                    date_valeur: '2015-01-01',
                    objectif: 513.79,
                    metadonnee_id: 1,
                  },
                  {
                    id: 10264,
                    date_valeur: '2016-01-01',
                    objectif: 527.25,
                    metadonnee_id: 1,
                  },
                ],
              },
              collectivite: {
                source: 'collectivite',
                metadonnees: [],
                valeurs: [
                  { id: 10264, date_valeur: '2015-01-01', resultat: 625 },
                ],
              },
            },
          },
          {
            definition: {
              id: 457,
              groupement_id: null,
              collectivite_id: null,
              identifiant_referentiel: 'cae_1.d',
              titre: 'Emissions de gaz à effet de serre - tertiaire',
              titre_long:
                'Emissions de gaz à effet de serre du secteur tertiaire',
              description: '',
              unite: 'teq CO2',
              borne_min: null,
              borne_max: null,
              participation_score: false,
              sans_valeur_utilisateur: false,
              valeur_calcule: null,
              modified_at: DateTime.fromISO(
                '2024-08-12T12:07:14.638Z',
              ).toJSDate(),
              created_at: DateTime.fromISO(
                '2024-08-12T12:07:14.638Z',
              ).toJSDate(),
              modified_by: null,
              created_by: null,
            },
            sources: {
              unknown: {
                source: 'unknown',
                metadonnees: [],
                valeurs: [
                  {
                    id: 10300,
                    date_valeur: '2016-01-01',
                    objectif: 423.08,
                    metadonnee_id: 3,
                  },
                ],
              },
            },
          },
        ];

      expect(indicateurValeursGroupees).toEqual(
        expectedIndicateurValeursGroupees,
      );
    });
  });
});
