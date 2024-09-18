import { Test } from '@nestjs/testing';
import * as _ from 'lodash';
import { DateTime } from 'luxon';
import { AuthService } from '../../auth/services/auth.service';
import DatabaseService from '../../common/services/database.service';
import {
  IndicateurAvecValeursParSource,
  IndicateurAvecValeursType,
  IndicateurDefinitionType,
  IndicateurSourceMetadonneeType,
  IndicateurValeurAvecMetadonnesDefinition,
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
        if (token === DatabaseService || token === AuthService) {
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
        indicateur1, // duplicate
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
      const expectedIndicateurValeursGroupees: IndicateurAvecValeursType[] = [
        {
          definition: {
            id: 456,
            identifiant_referentiel: 'cae_1.c',
            titre: 'Emissions de gaz à effet de serre - résidentiel',
            titre_long:
              'Emissions de gaz à effet de serre du secteur résidentiel',
            description: '',
            unite: 'teq CO2',
            borne_min: null,
            borne_max: null,
          },
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
          definition: {
            id: 457,
            identifiant_referentiel: 'cae_1.d',
            titre: 'Emissions de gaz à effet de serre - tertiaire',
            titre_long:
              'Emissions de gaz à effet de serre du secteur tertiaire',
            description: '',
            unite: 'teq CO2',
            borne_min: null,
            borne_max: null,
          },
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
        indicateur1, // duplicate
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

  describe('dedoublonnageIndicateurValeursParSource', () => {
    it('Même collectivite, Même date, Même indicateur mais deux sources différentes > pas de dédoublonnage', async () => {
      const indicateurValeurs: IndicateurValeurAvecMetadonnesDefinition[] = [
        {
          indicateur_valeur: {
            id: 17,
            collectivite_id: 4936,
            indicateur_id: 4,
            date_valeur: '2015-01-01',
            metadonnee_id: 1,
            resultat: 447868,
            resultat_commentaire: null,
            objectif: null,
            objectif_commentaire: null,
            estimation: null,
            modified_at: DateTime.fromISO(
              '2024-08-27T11:55:09.325Z',
            ).toJSDate(),
            created_at: DateTime.fromISO('2024-08-27T11:55:09.325Z').toJSDate(),
            modified_by: null,
            created_by: null,
          },
          indicateur_definition: {
            id: 4,
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
              '2024-08-27T11:54:51.791Z',
            ).toJSDate(),
            created_at: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            modified_by: null,
            created_by: null,
          },
          indicateur_source_metadonnee: {
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
        },
        {
          indicateur_valeur: {
            id: 875,
            collectivite_id: 4936,
            indicateur_id: 4,
            date_valeur: '2015-01-01',
            metadonnee_id: 2,
            resultat: null,
            resultat_commentaire: null,
            objectif: 513790,
            objectif_commentaire: null,
            estimation: null,
            modified_at: DateTime.fromISO(
              '2024-08-27T11:57:28.686Z',
            ).toJSDate(),
            created_at: DateTime.fromISO('2024-08-27T11:57:28.686Z').toJSDate(),
            modified_by: null,
            created_by: null,
          },
          indicateur_definition: {
            id: 4,
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
              '2024-08-27T11:54:51.791Z',
            ).toJSDate(),
            created_at: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            modified_by: null,
            created_by: null,
          },
          indicateur_source_metadonnee: {
            id: 2,
            source_id: 'snbc',
            date_version: DateTime.fromISO(
              '2024-07-11T00:00:00.000Z',
            ).toJSDate(),
            nom_donnees: null,
            diffuseur: null,
            producteur: null,
            methodologie: null,
            limites: null,
          },
        },
      ];
      const indicateurValeursDedoublonnees =
        indicateurService.dedoublonnageIndicateurValeursParSource(
          indicateurValeurs,
        );

      // Même date mais deux sources différentes, on ne doit pas dédoublonner
      const indicateurValeursDedoublonneesAttendues: IndicateurValeurAvecMetadonnesDefinition[] =
        _.cloneDeep(indicateurValeurs);

      expect(indicateurValeursDedoublonnees).toEqual(
        indicateurValeursDedoublonneesAttendues,
      );
    });

    it('Même collectivite, Même source, Même date mais deux indicateurs différentes > pas de dédoublonnage', async () => {
      const indicateurValeurs: IndicateurValeurAvecMetadonnesDefinition[] = [
        {
          indicateur_valeur: {
            id: 17,
            collectivite_id: 4936,
            indicateur_id: 4,
            date_valeur: '2015-01-01',
            metadonnee_id: 1,
            resultat: 447868,
            resultat_commentaire: null,
            objectif: null,
            objectif_commentaire: null,
            estimation: null,
            modified_at: DateTime.fromISO(
              '2024-08-27T11:55:09.325Z',
            ).toJSDate(),
            created_at: DateTime.fromISO('2024-08-27T11:55:09.325Z').toJSDate(),
            modified_by: null,
            created_by: null,
          },
          indicateur_definition: {
            id: 4,
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
              '2024-08-27T11:54:51.791Z',
            ).toJSDate(),
            created_at: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            modified_by: null,
            created_by: null,
          },
          indicateur_source_metadonnee: {
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
        },
        {
          indicateur_valeur: {
            id: 18,
            collectivite_id: 4936,
            indicateur_id: 9,
            date_valeur: '2015-01-01',
            metadonnee_id: 1,
            resultat: 471107,
            resultat_commentaire: null,
            objectif: null,
            objectif_commentaire: null,
            estimation: null,
            modified_at: DateTime.fromISO(
              '2024-08-27T11:55:09.325Z',
            ).toJSDate(),
            created_at: DateTime.fromISO('2024-08-27T11:55:09.325Z').toJSDate(),
            modified_by: null,
            created_by: null,
          },
          indicateur_definition: {
            id: 9,
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
              '2024-08-27T11:54:51.791Z',
            ).toJSDate(),
            created_at: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            modified_by: null,
            created_by: null,
          },
          indicateur_source_metadonnee: {
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
        },
      ];
      const indicateurValeursDedoublonnees =
        indicateurService.dedoublonnageIndicateurValeursParSource(
          indicateurValeurs,
        );

      // Même date mais deux indicateurs différents, on ne doit pas dédoublonner
      const indicateurValeursDedoublonneesAttendues: IndicateurValeurAvecMetadonnesDefinition[] =
        _.cloneDeep(indicateurValeurs);

      expect(indicateurValeursDedoublonnees).toEqual(
        indicateurValeursDedoublonneesAttendues,
      );
    });

    it('Même collectivite, Même date, Même indicateur mais une source et une donnée utilisateur > pas de dédoublonnage', async () => {
      const indicateurValeurs: IndicateurValeurAvecMetadonnesDefinition[] = [
        {
          indicateur_valeur: {
            id: 17,
            collectivite_id: 4936,
            indicateur_id: 4,
            date_valeur: '2015-01-01',
            metadonnee_id: 1,
            resultat: 447868,
            resultat_commentaire: null,
            objectif: null,
            objectif_commentaire: null,
            estimation: null,
            modified_at: DateTime.fromISO(
              '2024-08-27T11:55:09.325Z',
            ).toJSDate(),
            created_at: DateTime.fromISO('2024-08-27T11:55:09.325Z').toJSDate(),
            modified_by: null,
            created_by: null,
          },
          indicateur_definition: {
            id: 4,
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
              '2024-08-27T11:54:51.791Z',
            ).toJSDate(),
            created_at: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            modified_by: null,
            created_by: null,
          },
          indicateur_source_metadonnee: {
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
        },
        {
          indicateur_valeur: {
            id: 875,
            collectivite_id: 4936,
            indicateur_id: 4,
            date_valeur: '2015-01-01',
            metadonnee_id: null,
            resultat: null,
            resultat_commentaire: null,
            objectif: 513790,
            objectif_commentaire: null,
            estimation: null,
            modified_at: DateTime.fromISO(
              '2024-08-27T11:57:28.686Z',
            ).toJSDate(),
            created_at: DateTime.fromISO('2024-08-27T11:57:28.686Z').toJSDate(),
            modified_by: null,
            created_by: null,
          },
          indicateur_definition: {
            id: 4,
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
              '2024-08-27T11:54:51.791Z',
            ).toJSDate(),
            created_at: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            modified_by: null,
            created_by: null,
          },
          indicateur_source_metadonnee: null,
        },
      ];
      const indicateurValeursDedoublonnees =
        indicateurService.dedoublonnageIndicateurValeursParSource(
          indicateurValeurs,
        );

      // Même date mais deux sources différentes, on ne doit pas dédoublonner
      const indicateurValeursDedoublonneesAttendues: IndicateurValeurAvecMetadonnesDefinition[] =
        _.cloneDeep(indicateurValeurs);

      expect(indicateurValeursDedoublonnees).toEqual(
        indicateurValeursDedoublonneesAttendues,
      );
    });

    it('Même indicateur, Même source, Même date mais deux collectivités différentes > pas de dédoublonnage', async () => {
      const indicateurValeurs: IndicateurValeurAvecMetadonnesDefinition[] = [
        {
          indicateur_valeur: {
            id: 17,
            collectivite_id: 4936,
            indicateur_id: 4,
            date_valeur: '2015-01-01',
            metadonnee_id: 1,
            resultat: 447868,
            resultat_commentaire: null,
            objectif: null,
            objectif_commentaire: null,
            estimation: null,
            modified_at: DateTime.fromISO(
              '2024-08-27T11:55:09.325Z',
            ).toJSDate(),
            created_at: DateTime.fromISO('2024-08-27T11:55:09.325Z').toJSDate(),
            modified_by: null,
            created_by: null,
          },
          indicateur_definition: {
            id: 4,
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
              '2024-08-27T11:54:51.791Z',
            ).toJSDate(),
            created_at: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            modified_by: null,
            created_by: null,
          },
          indicateur_source_metadonnee: {
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
        },
        {
          indicateur_valeur: {
            id: 875,
            collectivite_id: 2012,
            indicateur_id: 4,
            date_valeur: '2015-01-01',
            metadonnee_id: 1,
            resultat: null,
            resultat_commentaire: null,
            objectif: 513790,
            objectif_commentaire: null,
            estimation: null,
            modified_at: DateTime.fromISO(
              '2024-08-27T11:57:28.686Z',
            ).toJSDate(),
            created_at: DateTime.fromISO('2024-08-27T11:57:28.686Z').toJSDate(),
            modified_by: null,
            created_by: null,
          },
          indicateur_definition: {
            id: 4,
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
              '2024-08-27T11:54:51.791Z',
            ).toJSDate(),
            created_at: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            modified_by: null,
            created_by: null,
          },
          indicateur_source_metadonnee: {
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
        },
      ];
      const indicateurValeursDedoublonnees =
        indicateurService.dedoublonnageIndicateurValeursParSource(
          indicateurValeurs,
        );

      // Deux collectivités différentes, on ne doit pas dédoublonner
      const indicateurValeursDedoublonneesAttendues: IndicateurValeurAvecMetadonnesDefinition[] =
        _.cloneDeep(indicateurValeurs);

      expect(indicateurValeursDedoublonnees).toEqual(
        indicateurValeursDedoublonneesAttendues,
      );
    });

    it('Même collectivite, Même indicateur, Même source mais deux dates différentes > pas de dédoublonnage', async () => {
      const indicateurValeurs: IndicateurValeurAvecMetadonnesDefinition[] = [
        {
          indicateur_valeur: {
            id: 17,
            collectivite_id: 4936,
            indicateur_id: 4,
            date_valeur: '2015-01-01',
            metadonnee_id: 1,
            resultat: 447868,
            resultat_commentaire: null,
            objectif: null,
            objectif_commentaire: null,
            estimation: null,
            modified_at: DateTime.fromISO(
              '2024-08-27T11:55:09.325Z',
            ).toJSDate(),
            created_at: DateTime.fromISO('2024-08-27T11:55:09.325Z').toJSDate(),
            modified_by: null,
            created_by: null,
          },
          indicateur_definition: {
            id: 4,
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
              '2024-08-27T11:54:51.791Z',
            ).toJSDate(),
            created_at: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            modified_by: null,
            created_by: null,
          },
          indicateur_source_metadonnee: {
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
        },
        {
          indicateur_valeur: {
            id: 875,
            collectivite_id: 4936,
            indicateur_id: 4,
            date_valeur: '2014-01-01',
            metadonnee_id: 1,
            resultat: null,
            resultat_commentaire: null,
            objectif: 513790,
            objectif_commentaire: null,
            estimation: null,
            modified_at: DateTime.fromISO(
              '2024-08-27T11:57:28.686Z',
            ).toJSDate(),
            created_at: DateTime.fromISO('2024-08-27T11:57:28.686Z').toJSDate(),
            modified_by: null,
            created_by: null,
          },
          indicateur_definition: {
            id: 4,
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
              '2024-08-27T11:54:51.791Z',
            ).toJSDate(),
            created_at: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            modified_by: null,
            created_by: null,
          },
          indicateur_source_metadonnee: {
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
        },
      ];
      const indicateurValeursDedoublonnees =
        indicateurService.dedoublonnageIndicateurValeursParSource(
          indicateurValeurs,
        );

      // Même source mais deux dates différentes, on ne doit pas dédoublonner
      const indicateurValeursDedoublonneesAttendues: IndicateurValeurAvecMetadonnesDefinition[] =
        _.cloneDeep(indicateurValeurs);

      expect(indicateurValeursDedoublonnees).toEqual(
        indicateurValeursDedoublonneesAttendues,
      );
    });

    it('Même source, même date et métadonnées différentes, on prend la plus récente', async () => {
      const indicateurValeur1: IndicateurValeurAvecMetadonnesDefinition = {
        indicateur_valeur: {
          id: 17,
          collectivite_id: 4936,
          indicateur_id: 4,
          date_valeur: '2015-01-01',
          metadonnee_id: 1,
          resultat: 447868,
          resultat_commentaire: null,
          objectif: null,
          objectif_commentaire: null,
          estimation: null,
          modified_at: DateTime.fromISO('2024-08-27T11:55:09.325Z').toJSDate(),
          created_at: DateTime.fromISO('2024-08-27T11:55:09.325Z').toJSDate(),
          modified_by: null,
          created_by: null,
        },
        indicateur_definition: {
          id: 4,
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
          modified_at: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
          created_at: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
          modified_by: null,
          created_by: null,
        },
        indicateur_source_metadonnee: {
          id: 1,
          source_id: 'rare',
          date_version: DateTime.fromISO('2024-07-18T00:00:00.000Z').toJSDate(),
          nom_donnees: '',
          diffuseur: 'OREC',
          producteur: '',
          methodologie: 'Scope 1&2 (approche cadastrale)',
          limites: '',
        },
      };
      const indicateurValeur2: IndicateurValeurAvecMetadonnesDefinition = {
        indicateur_valeur: {
          id: 875,
          collectivite_id: 4936,
          indicateur_id: 4,
          date_valeur: '2015-01-01',
          metadonnee_id: 2,
          resultat: null,
          resultat_commentaire: null,
          objectif: 513790,
          objectif_commentaire: null,
          estimation: null,
          modified_at: DateTime.fromISO('2024-08-27T11:57:28.686Z').toJSDate(),
          created_at: DateTime.fromISO('2024-08-27T11:57:28.686Z').toJSDate(),
          modified_by: null,
          created_by: null,
        },
        indicateur_definition: {
          id: 4,
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
          modified_at: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
          created_at: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
          modified_by: null,
          created_by: null,
        },
        indicateur_source_metadonnee: {
          id: 2,
          source_id: 'rare',
          date_version: DateTime.fromISO('2024-08-01T00:00:00.000Z').toJSDate(),
          nom_donnees: '',
          diffuseur: 'OREC',
          producteur: '',
          methodologie: 'Scope 1&2 (approche cadastrale)',
          limites: '',
        },
      };
      const indicateurValeursDedoublonnees =
        indicateurService.dedoublonnageIndicateurValeursParSource([
          indicateurValeur1,
          indicateurValeur2,
        ]);

      // On ne doit garder que la valeur la plus récente
      const indicateurValeursDedoublonneesAttendues: IndicateurValeurAvecMetadonnesDefinition[] =
        [_.cloneDeep(indicateurValeur2)];

      expect(indicateurValeursDedoublonnees).toEqual(
        indicateurValeursDedoublonneesAttendues,
      );

      // On inverse l'ordre des valeurs
      const indicateurValeursDedoublonnees2 =
        indicateurService.dedoublonnageIndicateurValeursParSource([
          indicateurValeur2,
          indicateurValeur1,
        ]);

      expect(indicateurValeursDedoublonnees2).toEqual(
        indicateurValeursDedoublonneesAttendues,
      );
    });

    it("Doublon parfait, on en conserve qu'un", async () => {
      const indicateurValeur1: IndicateurValeurAvecMetadonnesDefinition = {
        indicateur_valeur: {
          id: 17,
          collectivite_id: 4936,
          indicateur_id: 4,
          date_valeur: '2015-01-01',
          metadonnee_id: 1,
          resultat: 447868,
          resultat_commentaire: null,
          objectif: null,
          objectif_commentaire: null,
          estimation: null,
          modified_at: DateTime.fromISO('2024-08-27T11:55:09.325Z').toJSDate(),
          created_at: DateTime.fromISO('2024-08-27T11:55:09.325Z').toJSDate(),
          modified_by: null,
          created_by: null,
        },
        indicateur_definition: {
          id: 4,
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
          modified_at: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
          created_at: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
          modified_by: null,
          created_by: null,
        },
        indicateur_source_metadonnee: {
          id: 1,
          source_id: 'rare',
          date_version: DateTime.fromISO('2024-07-18T00:00:00.000Z').toJSDate(),
          nom_donnees: '',
          diffuseur: 'OREC',
          producteur: '',
          methodologie: 'Scope 1&2 (approche cadastrale)',
          limites: '',
        },
      };
      const indicateurValeursDedoublonnees =
        indicateurService.dedoublonnageIndicateurValeursParSource([
          indicateurValeur1,
          _.cloneDeep(indicateurValeur1),
        ]);

      // On ne doit garder que la valeur la plus récente
      const indicateurValeursDedoublonneesAttendues: IndicateurValeurAvecMetadonnesDefinition[] =
        [_.cloneDeep(indicateurValeur1)];

      expect(indicateurValeursDedoublonnees).toEqual(
        indicateurValeursDedoublonneesAttendues,
      );
    });
  });
});
