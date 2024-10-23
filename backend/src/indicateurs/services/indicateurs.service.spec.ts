import { Test } from '@nestjs/testing';
import * as _ from 'lodash';
import { DateTime } from 'luxon';
import { AuthService } from '../../auth/services/auth.service';
import DatabaseService from '../../common/services/database.service';
import IndicateursService from './indicateurs.service';
import { IndicateurDefinitionType } from '../models/indicateur-definition.table';
import {
  IndicateurAvecValeursParSource,
  IndicateurAvecValeursType,
  IndicateurValeurAvecMetadonnesDefinition,
  IndicateurValeurType,
} from '../models/indicateur-valeur.table';
import { IndicateurSourceMetadonneeType } from '../models/indicateur-source-metadonnee.table';

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
        groupementId: null,
        collectiviteId: null,
        identifiantReferentiel: 'cae_1.c',
        titre: 'Emissions de gaz à effet de serre - résidentiel',
        titreLong: 'Emissions de gaz à effet de serre du secteur résidentiel',
        description: '',
        unite: 'teq CO2',
        borneMin: null,
        borneMax: null,
        participationScore: false,
        sansValeurUtilisateur: false,
        valeurCalcule: null,
        modifiedAt: DateTime.fromISO('2024-08-12T12:07:14.638Z').toJSDate(),
        createdAt: DateTime.fromISO('2024-08-12T12:07:14.638Z').toJSDate(),
        modifiedBy: null,
        createdBy: null,
      };
      const indicateur2: IndicateurDefinitionType = {
        id: 457,
        groupementId: null,
        collectiviteId: null,
        identifiantReferentiel: 'cae_1.d',
        titre: 'Emissions de gaz à effet de serre - tertiaire',
        titreLong: 'Emissions de gaz à effet de serre du secteur tertiaire',
        description: '',
        unite: 'teq CO2',
        borneMin: null,
        borneMax: null,
        participationScore: false,
        sansValeurUtilisateur: false,
        valeurCalcule: null,
        modifiedAt: DateTime.fromISO('2024-08-12T12:07:14.638Z').toJSDate(),
        createdAt: DateTime.fromISO('2024-08-12T12:07:14.638Z').toJSDate(),
        modifiedBy: null,
        createdBy: null,
      };
      const indicateur3: IndicateurDefinitionType = {
        id: 458,
        groupementId: null,
        collectiviteId: null,
        identifiantReferentiel: 'cae_1.e',
        titre: 'Emissions de gaz à effet de serre - transport routier',
        titreLong:
          'Emissions de gaz à effet de serre du secteur du transport routier',
        description: '',
        unite: 'teq CO2',
        borneMin: null,
        borneMax: null,
        participationScore: false,
        sansValeurUtilisateur: false,
        valeurCalcule: null,
        modifiedAt: DateTime.fromISO('2024-08-12T12:07:14.638Z').toJSDate(),
        createdAt: DateTime.fromISO('2024-08-12T12:07:14.638Z').toJSDate(),
        modifiedBy: null,
        createdBy: null,
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
          collectiviteId: 4936,
          indicateurId: 456,
          dateValeur: '2016-01-01',
          metadonneeId: 1,
          resultat: null,
          resultatCommentaire: null,
          objectif: 527.25,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: DateTime.fromISO('2024-08-14T14:10:18.891Z').toJSDate(),
          createdAt: DateTime.fromISO('2024-08-14T14:10:18.891Z').toJSDate(),
          modifiedBy: null,
          createdBy: null,
        },
        {
          id: 10263,
          collectiviteId: 4936,
          indicateurId: 456,
          dateValeur: '2015-01-01',
          metadonneeId: 1,
          resultat: null,
          resultatCommentaire: null,
          objectif: 513.79,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: DateTime.fromISO('2024-08-14T14:10:18.891Z').toJSDate(),
          createdAt: DateTime.fromISO('2024-08-14T14:10:18.891Z').toJSDate(),
          modifiedBy: null,
          createdBy: null,
        },
        {
          id: 10300,
          collectiviteId: 4936,
          indicateurId: 457,
          dateValeur: '2016-01-01',
          metadonneeId: 1,
          resultat: null,
          resultatCommentaire: null,
          objectif: 423.08,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: DateTime.fromISO('2024-08-14T14:10:18.891Z').toJSDate(),
          createdAt: DateTime.fromISO('2024-08-14T14:10:18.891Z').toJSDate(),
          modifiedBy: null,
          createdBy: null,
        },
      ];
      const indicateurValeursGroupees =
        indicateurService.groupeIndicateursValeursParIndicateur(
          indicateurValeurs,
          indicateurDefinitions
        );
      const expectedIndicateurValeursGroupees: IndicateurAvecValeursType[] = [
        {
          definition: {
            id: 456,
            identifiantReferentiel: 'cae_1.c',
            titre: 'Emissions de gaz à effet de serre - résidentiel',
            titreLong:
              'Emissions de gaz à effet de serre du secteur résidentiel',
            description: '',
            unite: 'teq CO2',
            borneMin: null,
            borneMax: null,
          },
          valeurs: [
            {
              dateValeur: '2015-01-01',
              id: 10263,
              objectif: 513.79,
            },
            {
              dateValeur: '2016-01-01',
              id: 10264,
              objectif: 527.25,
            },
          ],
        },
        {
          definition: {
            id: 457,
            identifiantReferentiel: 'cae_1.d',
            titre: 'Emissions de gaz à effet de serre - tertiaire',
            titreLong: 'Emissions de gaz à effet de serre du secteur tertiaire',
            description: '',
            unite: 'teq CO2',
            borneMin: null,
            borneMax: null,
          },
          valeurs: [
            {
              dateValeur: '2016-01-01',
              id: 10300,
              objectif: 423.08,
            },
          ],
        },
      ];

      expect(indicateurValeursGroupees).toEqual(
        expectedIndicateurValeursGroupees
      );
    });
  });

  describe('groupeIndicateursValeursParIndicateurEtSource', () => {
    it('Groupe les valeurs par indicateur et par source, trie par date croissante les valeurs', async () => {
      const indicateur1: IndicateurDefinitionType = {
        id: 456,
        groupementId: null,
        collectiviteId: null,
        identifiantReferentiel: 'cae_1.c',
        titre: 'Emissions de gaz à effet de serre - résidentiel',
        titreLong: 'Emissions de gaz à effet de serre du secteur résidentiel',
        description: '',
        unite: 'teq CO2',
        borneMin: null,
        borneMax: null,
        participationScore: false,
        sansValeurUtilisateur: false,
        valeurCalcule: null,
        modifiedAt: DateTime.fromISO('2024-08-12T12:07:14.638Z').toJSDate(),
        createdAt: DateTime.fromISO('2024-08-12T12:07:14.638Z').toJSDate(),
        modifiedBy: null,
        createdBy: null,
      };
      const indicateur2: IndicateurDefinitionType = {
        id: 457,
        groupementId: null,
        collectiviteId: null,
        identifiantReferentiel: 'cae_1.d',
        titre: 'Emissions de gaz à effet de serre - tertiaire',
        titreLong: 'Emissions de gaz à effet de serre du secteur tertiaire',
        description: '',
        unite: 'teq CO2',
        borneMin: null,
        borneMax: null,
        participationScore: false,
        sansValeurUtilisateur: false,
        valeurCalcule: null,
        modifiedAt: DateTime.fromISO('2024-08-12T12:07:14.638Z').toJSDate(),
        createdAt: DateTime.fromISO('2024-08-12T12:07:14.638Z').toJSDate(),
        modifiedBy: null,
        createdBy: null,
      };
      const indicateur3: IndicateurDefinitionType = {
        id: 458,
        groupementId: null,
        collectiviteId: null,
        identifiantReferentiel: 'cae_1.e',
        titre: 'Emissions de gaz à effet de serre - transport routier',
        titreLong:
          'Emissions de gaz à effet de serre du secteur du transport routier',
        description: '',
        unite: 'teq CO2',
        borneMin: null,
        borneMax: null,
        participationScore: false,
        sansValeurUtilisateur: false,
        valeurCalcule: null,
        modifiedAt: DateTime.fromISO('2024-08-12T12:07:14.638Z').toJSDate(),
        createdAt: DateTime.fromISO('2024-08-12T12:07:14.638Z').toJSDate(),
        modifiedBy: null,
        createdBy: null,
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
          sourceId: 'rare',
          dateVersion: DateTime.fromISO('2024-07-18T00:00:00.000Z').toJSDate(),
          nomDonnees: '',
          diffuseur: 'OREC',
          producteur: '',
          methodologie: 'Scope 1&2 (approche cadastrale)',
          limites: '',
        },
        {
          id: 2,
          sourceId: 'snbc',
          dateVersion: DateTime.fromISO('2024-07-11T00:00:00.000Z').toJSDate(),
          nomDonnees: null,
          diffuseur: null,
          producteur: null,
          methodologie: null,
          limites: null,
        },
      ];

      const indicateurValeurs: IndicateurValeurType[] = [
        {
          id: 10264,
          collectiviteId: 4936,
          indicateurId: 456,
          dateValeur: '2016-01-01',
          metadonneeId: 1,
          resultat: null,
          resultatCommentaire: null,
          objectif: 527.25,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: DateTime.fromISO('2024-08-14T14:10:18.891Z').toJSDate(),
          createdAt: DateTime.fromISO('2024-08-14T14:10:18.891Z').toJSDate(),
          modifiedBy: null,
          createdBy: null,
        },
        {
          id: 10263,
          collectiviteId: 4936,
          indicateurId: 456,
          dateValeur: '2015-01-01',
          metadonneeId: 1,
          resultat: null,
          resultatCommentaire: null,
          objectif: 513.79,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: DateTime.fromISO('2024-08-14T14:10:18.891Z').toJSDate(),
          createdAt: DateTime.fromISO('2024-08-14T14:10:18.891Z').toJSDate(),
          modifiedBy: null,
          createdBy: null,
        },
        {
          id: 10264,
          collectiviteId: 4936,
          indicateurId: 456,
          dateValeur: '2015-01-01',
          metadonneeId: null,
          resultat: 625,
          resultatCommentaire: null,
          objectif: null,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: DateTime.fromISO('2024-08-14T14:10:18.891Z').toJSDate(),
          createdAt: DateTime.fromISO('2024-08-14T14:10:18.891Z').toJSDate(),
          modifiedBy: null,
          createdBy: null,
        },
        {
          id: 10300,
          collectiviteId: 4936,
          indicateurId: 457,
          dateValeur: '2016-01-01',
          metadonneeId: 3,
          resultat: null,
          resultatCommentaire: null,
          objectif: 423.08,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: DateTime.fromISO('2024-08-14T14:10:18.891Z').toJSDate(),
          createdAt: DateTime.fromISO('2024-08-14T14:10:18.891Z').toJSDate(),
          modifiedBy: null,
          createdBy: null,
        },
      ];
      const indicateurValeursGroupees =
        indicateurService.groupeIndicateursValeursParIndicateurEtSource(
          indicateurValeurs,
          indicateurDefinitions,
          indicateurMetadonnees
        );
      const expectedIndicateurValeursGroupees: IndicateurAvecValeursParSource[] =
        [
          {
            definition: {
              id: 456,
              groupementId: null,
              collectiviteId: null,
              identifiantReferentiel: 'cae_1.c',
              titre: 'Emissions de gaz à effet de serre - résidentiel',
              titreLong:
                'Emissions de gaz à effet de serre du secteur résidentiel',
              description: '',
              unite: 'teq CO2',
              borneMin: null,
              borneMax: null,
              participationScore: false,
              sansValeurUtilisateur: false,
              valeurCalcule: null,
              modifiedAt: DateTime.fromISO(
                '2024-08-12T12:07:14.638Z'
              ).toJSDate(),
              createdAt: DateTime.fromISO(
                '2024-08-12T12:07:14.638Z'
              ).toJSDate(),
              modifiedBy: null,
              createdBy: null,
            },
            sources: {
              rare: {
                source: 'rare',
                metadonnees: [
                  {
                    id: 1,
                    sourceId: 'rare',
                    dateVersion: DateTime.fromISO(
                      '2024-07-18T00:00:00.000Z'
                    ).toJSDate(),
                    nomDonnees: '',
                    diffuseur: 'OREC',
                    producteur: '',
                    methodologie: 'Scope 1&2 (approche cadastrale)',
                    limites: '',
                  },
                ],
                valeurs: [
                  {
                    id: 10263,
                    dateValeur: '2015-01-01',
                    objectif: 513.79,
                    metadonneeId: 1,
                  },
                  {
                    id: 10264,
                    dateValeur: '2016-01-01',
                    objectif: 527.25,
                    metadonneeId: 1,
                  },
                ],
              },
              collectivite: {
                source: 'collectivite',
                metadonnees: [],
                valeurs: [
                  { id: 10264, dateValeur: '2015-01-01', resultat: 625 },
                ],
              },
            },
          },
          {
            definition: {
              id: 457,
              groupementId: null,
              collectiviteId: null,
              identifiantReferentiel: 'cae_1.d',
              titre: 'Emissions de gaz à effet de serre - tertiaire',
              titreLong:
                'Emissions de gaz à effet de serre du secteur tertiaire',
              description: '',
              unite: 'teq CO2',
              borneMin: null,
              borneMax: null,
              participationScore: false,
              sansValeurUtilisateur: false,
              valeurCalcule: null,
              modifiedAt: DateTime.fromISO(
                '2024-08-12T12:07:14.638Z'
              ).toJSDate(),
              createdAt: DateTime.fromISO(
                '2024-08-12T12:07:14.638Z'
              ).toJSDate(),
              modifiedBy: null,
              createdBy: null,
            },
            sources: {
              unknown: {
                source: 'unknown',
                metadonnees: [],
                valeurs: [
                  {
                    id: 10300,
                    dateValeur: '2016-01-01',
                    objectif: 423.08,
                    metadonneeId: 3,
                  },
                ],
              },
            },
          },
        ];

      expect(indicateurValeursGroupees).toEqual(
        expectedIndicateurValeursGroupees
      );
    });
  });

  describe('dedoublonnageIndicateurValeursParSource', () => {
    it('Même collectivite, Même date, Même indicateur mais deux sources différentes > pas de dédoublonnage', async () => {
      const indicateurValeurs: IndicateurValeurAvecMetadonnesDefinition[] = [
        {
          indicateur_valeur: {
            id: 17,
            collectiviteId: 4936,
            indicateurId: 4,
            dateValeur: '2015-01-01',
            metadonneeId: 1,
            resultat: 447868,
            resultatCommentaire: null,
            objectif: null,
            objectifCommentaire: null,
            estimation: null,
            modifiedAt: DateTime.fromISO('2024-08-27T11:55:09.325Z').toJSDate(),
            createdAt: DateTime.fromISO('2024-08-27T11:55:09.325Z').toJSDate(),
            modifiedBy: null,
            createdBy: null,
          },
          indicateur_definition: {
            id: 4,
            groupementId: null,
            collectiviteId: null,
            identifiantReferentiel: 'cae_1.c',
            titre: 'Emissions de gaz à effet de serre - résidentiel',
            titreLong:
              'Emissions de gaz à effet de serre du secteur résidentiel',
            description: '',
            unite: 'teq CO2',
            borneMin: null,
            borneMax: null,
            participationScore: false,
            sansValeurUtilisateur: false,
            valeurCalcule: null,
            modifiedAt: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            createdAt: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            modifiedBy: null,
            createdBy: null,
          },
          indicateur_source_metadonnee: {
            id: 1,
            sourceId: 'rare',
            dateVersion: DateTime.fromISO(
              '2024-07-18T00:00:00.000Z'
            ).toJSDate(),
            nomDonnees: '',
            diffuseur: 'OREC',
            producteur: '',
            methodologie: 'Scope 1&2 (approche cadastrale)',
            limites: '',
          },
        },
        {
          indicateur_valeur: {
            id: 875,
            collectiviteId: 4936,
            indicateurId: 4,
            dateValeur: '2015-01-01',
            metadonneeId: 2,
            resultat: null,
            resultatCommentaire: null,
            objectif: 513790,
            objectifCommentaire: null,
            estimation: null,
            modifiedAt: DateTime.fromISO('2024-08-27T11:57:28.686Z').toJSDate(),
            createdAt: DateTime.fromISO('2024-08-27T11:57:28.686Z').toJSDate(),
            modifiedBy: null,
            createdBy: null,
          },
          indicateur_definition: {
            id: 4,
            groupementId: null,
            collectiviteId: null,
            identifiantReferentiel: 'cae_1.c',
            titre: 'Emissions de gaz à effet de serre - résidentiel',
            titreLong:
              'Emissions de gaz à effet de serre du secteur résidentiel',
            description: '',
            unite: 'teq CO2',
            borneMin: null,
            borneMax: null,
            participationScore: false,
            sansValeurUtilisateur: false,
            valeurCalcule: null,
            modifiedAt: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            createdAt: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            modifiedBy: null,
            createdBy: null,
          },
          indicateur_source_metadonnee: {
            id: 2,
            sourceId: 'snbc',
            dateVersion: DateTime.fromISO(
              '2024-07-11T00:00:00.000Z'
            ).toJSDate(),
            nomDonnees: null,
            diffuseur: null,
            producteur: null,
            methodologie: null,
            limites: null,
          },
        },
      ];
      const indicateurValeursDedoublonnees =
        indicateurService.dedoublonnageIndicateurValeursParSource(
          indicateurValeurs
        );

      // Même date mais deux sources différentes, on ne doit pas dédoublonner
      const indicateurValeursDedoublonneesAttendues: IndicateurValeurAvecMetadonnesDefinition[] =
        _.cloneDeep(indicateurValeurs);

      expect(indicateurValeursDedoublonnees).toEqual(
        indicateurValeursDedoublonneesAttendues
      );
    });

    it('Même collectivite, Même source, Même date mais deux indicateurs différentes > pas de dédoublonnage', async () => {
      const indicateurValeurs: IndicateurValeurAvecMetadonnesDefinition[] = [
        {
          indicateur_valeur: {
            id: 17,
            collectiviteId: 4936,
            indicateurId: 4,
            dateValeur: '2015-01-01',
            metadonneeId: 1,
            resultat: 447868,
            resultatCommentaire: null,
            objectif: null,
            objectifCommentaire: null,
            estimation: null,
            modifiedAt: DateTime.fromISO('2024-08-27T11:55:09.325Z').toJSDate(),
            createdAt: DateTime.fromISO('2024-08-27T11:55:09.325Z').toJSDate(),
            modifiedBy: null,
            createdBy: null,
          },
          indicateur_definition: {
            id: 4,
            groupementId: null,
            collectiviteId: null,
            identifiantReferentiel: 'cae_1.c',
            titre: 'Emissions de gaz à effet de serre - résidentiel',
            titreLong:
              'Emissions de gaz à effet de serre du secteur résidentiel',
            description: '',
            unite: 'teq CO2',
            borneMin: null,
            borneMax: null,
            participationScore: false,
            sansValeurUtilisateur: false,
            valeurCalcule: null,
            modifiedAt: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            createdAt: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            modifiedBy: null,
            createdBy: null,
          },
          indicateur_source_metadonnee: {
            id: 1,
            sourceId: 'rare',
            dateVersion: DateTime.fromISO(
              '2024-07-18T00:00:00.000Z'
            ).toJSDate(),
            nomDonnees: '',
            diffuseur: 'OREC',
            producteur: '',
            methodologie: 'Scope 1&2 (approche cadastrale)',
            limites: '',
          },
        },
        {
          indicateur_valeur: {
            id: 18,
            collectiviteId: 4936,
            indicateurId: 9,
            dateValeur: '2015-01-01',
            metadonneeId: 1,
            resultat: 471107,
            resultatCommentaire: null,
            objectif: null,
            objectifCommentaire: null,
            estimation: null,
            modifiedAt: DateTime.fromISO('2024-08-27T11:55:09.325Z').toJSDate(),
            createdAt: DateTime.fromISO('2024-08-27T11:55:09.325Z').toJSDate(),
            modifiedBy: null,
            createdBy: null,
          },
          indicateur_definition: {
            id: 9,
            groupementId: null,
            collectiviteId: null,
            identifiantReferentiel: 'cae_1.d',
            titre: 'Emissions de gaz à effet de serre - tertiaire',
            titreLong: 'Emissions de gaz à effet de serre du secteur tertiaire',
            description: '',
            unite: 'teq CO2',
            borneMin: null,
            borneMax: null,
            participationScore: false,
            sansValeurUtilisateur: false,
            valeurCalcule: null,
            modifiedAt: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            createdAt: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            modifiedBy: null,
            createdBy: null,
          },
          indicateur_source_metadonnee: {
            id: 1,
            sourceId: 'rare',
            dateVersion: DateTime.fromISO(
              '2024-07-18T00:00:00.000Z'
            ).toJSDate(),
            nomDonnees: '',
            diffuseur: 'OREC',
            producteur: '',
            methodologie: 'Scope 1&2 (approche cadastrale)',
            limites: '',
          },
        },
      ];
      const indicateurValeursDedoublonnees =
        indicateurService.dedoublonnageIndicateurValeursParSource(
          indicateurValeurs
        );

      // Même date mais deux indicateurs différents, on ne doit pas dédoublonner
      const indicateurValeursDedoublonneesAttendues: IndicateurValeurAvecMetadonnesDefinition[] =
        _.cloneDeep(indicateurValeurs);

      expect(indicateurValeursDedoublonnees).toEqual(
        indicateurValeursDedoublonneesAttendues
      );
    });

    it('Même collectivite, Même date, Même indicateur mais une source et une donnée utilisateur > pas de dédoublonnage', async () => {
      const indicateurValeurs: IndicateurValeurAvecMetadonnesDefinition[] = [
        {
          indicateur_valeur: {
            id: 17,
            collectiviteId: 4936,
            indicateurId: 4,
            dateValeur: '2015-01-01',
            metadonneeId: 1,
            resultat: 447868,
            resultatCommentaire: null,
            objectif: null,
            objectifCommentaire: null,
            estimation: null,
            modifiedAt: DateTime.fromISO('2024-08-27T11:55:09.325Z').toJSDate(),
            createdAt: DateTime.fromISO('2024-08-27T11:55:09.325Z').toJSDate(),
            modifiedBy: null,
            createdBy: null,
          },
          indicateur_definition: {
            id: 4,
            groupementId: null,
            collectiviteId: null,
            identifiantReferentiel: 'cae_1.c',
            titre: 'Emissions de gaz à effet de serre - résidentiel',
            titreLong:
              'Emissions de gaz à effet de serre du secteur résidentiel',
            description: '',
            unite: 'teq CO2',
            borneMin: null,
            borneMax: null,
            participationScore: false,
            sansValeurUtilisateur: false,
            valeurCalcule: null,
            modifiedAt: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            createdAt: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            modifiedBy: null,
            createdBy: null,
          },
          indicateur_source_metadonnee: {
            id: 1,
            sourceId: 'rare',
            dateVersion: DateTime.fromISO(
              '2024-07-18T00:00:00.000Z'
            ).toJSDate(),
            nomDonnees: '',
            diffuseur: 'OREC',
            producteur: '',
            methodologie: 'Scope 1&2 (approche cadastrale)',
            limites: '',
          },
        },
        {
          indicateur_valeur: {
            id: 875,
            collectiviteId: 4936,
            indicateurId: 4,
            dateValeur: '2015-01-01',
            metadonneeId: null,
            resultat: null,
            resultatCommentaire: null,
            objectif: 513790,
            objectifCommentaire: null,
            estimation: null,
            modifiedAt: DateTime.fromISO('2024-08-27T11:57:28.686Z').toJSDate(),
            createdAt: DateTime.fromISO('2024-08-27T11:57:28.686Z').toJSDate(),
            modifiedBy: null,
            createdBy: null,
          },
          indicateur_definition: {
            id: 4,
            groupementId: null,
            collectiviteId: null,
            identifiantReferentiel: 'cae_1.c',
            titre: 'Emissions de gaz à effet de serre - résidentiel',
            titreLong:
              'Emissions de gaz à effet de serre du secteur résidentiel',
            description: '',
            unite: 'teq CO2',
            borneMin: null,
            borneMax: null,
            participationScore: false,
            sansValeurUtilisateur: false,
            valeurCalcule: null,
            modifiedAt: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            createdAt: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            modifiedBy: null,
            createdBy: null,
          },
          indicateur_source_metadonnee: null,
        },
      ];
      const indicateurValeursDedoublonnees =
        indicateurService.dedoublonnageIndicateurValeursParSource(
          indicateurValeurs
        );

      // Même date mais deux sources différentes, on ne doit pas dédoublonner
      const indicateurValeursDedoublonneesAttendues: IndicateurValeurAvecMetadonnesDefinition[] =
        _.cloneDeep(indicateurValeurs);

      expect(indicateurValeursDedoublonnees).toEqual(
        indicateurValeursDedoublonneesAttendues
      );
    });

    it('Même indicateur, Même source, Même date mais deux collectivités différentes > pas de dédoublonnage', async () => {
      const indicateurValeurs: IndicateurValeurAvecMetadonnesDefinition[] = [
        {
          indicateur_valeur: {
            id: 17,
            collectiviteId: 4936,
            indicateurId: 4,
            dateValeur: '2015-01-01',
            metadonneeId: 1,
            resultat: 447868,
            resultatCommentaire: null,
            objectif: null,
            objectifCommentaire: null,
            estimation: null,
            modifiedAt: DateTime.fromISO('2024-08-27T11:55:09.325Z').toJSDate(),
            createdAt: DateTime.fromISO('2024-08-27T11:55:09.325Z').toJSDate(),
            modifiedBy: null,
            createdBy: null,
          },
          indicateur_definition: {
            id: 4,
            groupementId: null,
            collectiviteId: null,
            identifiantReferentiel: 'cae_1.c',
            titre: 'Emissions de gaz à effet de serre - résidentiel',
            titreLong:
              'Emissions de gaz à effet de serre du secteur résidentiel',
            description: '',
            unite: 'teq CO2',
            borneMin: null,
            borneMax: null,
            participationScore: false,
            sansValeurUtilisateur: false,
            valeurCalcule: null,
            modifiedAt: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            createdAt: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            modifiedBy: null,
            createdBy: null,
          },
          indicateur_source_metadonnee: {
            id: 1,
            sourceId: 'rare',
            dateVersion: DateTime.fromISO(
              '2024-07-18T00:00:00.000Z'
            ).toJSDate(),
            nomDonnees: '',
            diffuseur: 'OREC',
            producteur: '',
            methodologie: 'Scope 1&2 (approche cadastrale)',
            limites: '',
          },
        },
        {
          indicateur_valeur: {
            id: 875,
            collectiviteId: 2012,
            indicateurId: 4,
            dateValeur: '2015-01-01',
            metadonneeId: 1,
            resultat: null,
            resultatCommentaire: null,
            objectif: 513790,
            objectifCommentaire: null,
            estimation: null,
            modifiedAt: DateTime.fromISO('2024-08-27T11:57:28.686Z').toJSDate(),
            createdAt: DateTime.fromISO('2024-08-27T11:57:28.686Z').toJSDate(),
            modifiedBy: null,
            createdBy: null,
          },
          indicateur_definition: {
            id: 4,
            groupementId: null,
            collectiviteId: null,
            identifiantReferentiel: 'cae_1.c',
            titre: 'Emissions de gaz à effet de serre - résidentiel',
            titreLong:
              'Emissions de gaz à effet de serre du secteur résidentiel',
            description: '',
            unite: 'teq CO2',
            borneMin: null,
            borneMax: null,
            participationScore: false,
            sansValeurUtilisateur: false,
            valeurCalcule: null,
            modifiedAt: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            createdAt: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            modifiedBy: null,
            createdBy: null,
          },
          indicateur_source_metadonnee: {
            id: 1,
            sourceId: 'rare',
            dateVersion: DateTime.fromISO(
              '2024-07-18T00:00:00.000Z'
            ).toJSDate(),
            nomDonnees: '',
            diffuseur: 'OREC',
            producteur: '',
            methodologie: 'Scope 1&2 (approche cadastrale)',
            limites: '',
          },
        },
      ];
      const indicateurValeursDedoublonnees =
        indicateurService.dedoublonnageIndicateurValeursParSource(
          indicateurValeurs
        );

      // Deux collectivités différentes, on ne doit pas dédoublonner
      const indicateurValeursDedoublonneesAttendues: IndicateurValeurAvecMetadonnesDefinition[] =
        _.cloneDeep(indicateurValeurs);

      expect(indicateurValeursDedoublonnees).toEqual(
        indicateurValeursDedoublonneesAttendues
      );
    });

    it('Même collectivite, Même indicateur, Même source mais deux dates différentes > pas de dédoublonnage', async () => {
      const indicateurValeurs: IndicateurValeurAvecMetadonnesDefinition[] = [
        {
          indicateur_valeur: {
            id: 17,
            collectiviteId: 4936,
            indicateurId: 4,
            dateValeur: '2015-01-01',
            metadonneeId: 1,
            resultat: 447868,
            resultatCommentaire: null,
            objectif: null,
            objectifCommentaire: null,
            estimation: null,
            modifiedAt: DateTime.fromISO('2024-08-27T11:55:09.325Z').toJSDate(),
            createdAt: DateTime.fromISO('2024-08-27T11:55:09.325Z').toJSDate(),
            modifiedBy: null,
            createdBy: null,
          },
          indicateur_definition: {
            id: 4,
            groupementId: null,
            collectiviteId: null,
            identifiantReferentiel: 'cae_1.c',
            titre: 'Emissions de gaz à effet de serre - résidentiel',
            titreLong:
              'Emissions de gaz à effet de serre du secteur résidentiel',
            description: '',
            unite: 'teq CO2',
            borneMin: null,
            borneMax: null,
            participationScore: false,
            sansValeurUtilisateur: false,
            valeurCalcule: null,
            modifiedAt: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            createdAt: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            modifiedBy: null,
            createdBy: null,
          },
          indicateur_source_metadonnee: {
            id: 1,
            sourceId: 'rare',
            dateVersion: DateTime.fromISO(
              '2024-07-18T00:00:00.000Z'
            ).toJSDate(),
            nomDonnees: '',
            diffuseur: 'OREC',
            producteur: '',
            methodologie: 'Scope 1&2 (approche cadastrale)',
            limites: '',
          },
        },
        {
          indicateur_valeur: {
            id: 875,
            collectiviteId: 4936,
            indicateurId: 4,
            dateValeur: '2014-01-01',
            metadonneeId: 1,
            resultat: null,
            resultatCommentaire: null,
            objectif: 513790,
            objectifCommentaire: null,
            estimation: null,
            modifiedAt: DateTime.fromISO('2024-08-27T11:57:28.686Z').toJSDate(),
            createdAt: DateTime.fromISO('2024-08-27T11:57:28.686Z').toJSDate(),
            modifiedBy: null,
            createdBy: null,
          },
          indicateur_definition: {
            id: 4,
            groupementId: null,
            collectiviteId: null,
            identifiantReferentiel: 'cae_1.c',
            titre: 'Emissions de gaz à effet de serre - résidentiel',
            titreLong:
              'Emissions de gaz à effet de serre du secteur résidentiel',
            description: '',
            unite: 'teq CO2',
            borneMin: null,
            borneMax: null,
            participationScore: false,
            sansValeurUtilisateur: false,
            valeurCalcule: null,
            modifiedAt: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            createdAt: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
            modifiedBy: null,
            createdBy: null,
          },
          indicateur_source_metadonnee: {
            id: 1,
            sourceId: 'rare',
            dateVersion: DateTime.fromISO(
              '2024-07-18T00:00:00.000Z'
            ).toJSDate(),
            nomDonnees: '',
            diffuseur: 'OREC',
            producteur: '',
            methodologie: 'Scope 1&2 (approche cadastrale)',
            limites: '',
          },
        },
      ];
      const indicateurValeursDedoublonnees =
        indicateurService.dedoublonnageIndicateurValeursParSource(
          indicateurValeurs
        );

      // Même source mais deux dates différentes, on ne doit pas dédoublonner
      const indicateurValeursDedoublonneesAttendues: IndicateurValeurAvecMetadonnesDefinition[] =
        _.cloneDeep(indicateurValeurs);

      expect(indicateurValeursDedoublonnees).toEqual(
        indicateurValeursDedoublonneesAttendues
      );
    });

    it('Même source, même date et métadonnées différentes, on prend la plus récente', async () => {
      const indicateurValeur1: IndicateurValeurAvecMetadonnesDefinition = {
        indicateur_valeur: {
          id: 17,
          collectiviteId: 4936,
          indicateurId: 4,
          dateValeur: '2015-01-01',
          metadonneeId: 1,
          resultat: 447868,
          resultatCommentaire: null,
          objectif: null,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: DateTime.fromISO('2024-08-27T11:55:09.325Z').toJSDate(),
          createdAt: DateTime.fromISO('2024-08-27T11:55:09.325Z').toJSDate(),
          modifiedBy: null,
          createdBy: null,
        },
        indicateur_definition: {
          id: 4,
          groupementId: null,
          collectiviteId: null,
          identifiantReferentiel: 'cae_1.c',
          titre: 'Emissions de gaz à effet de serre - résidentiel',
          titreLong: 'Emissions de gaz à effet de serre du secteur résidentiel',
          description: '',
          unite: 'teq CO2',
          borneMin: null,
          borneMax: null,
          participationScore: false,
          sansValeurUtilisateur: false,
          valeurCalcule: null,
          modifiedAt: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
          createdAt: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
          modifiedBy: null,
          createdBy: null,
        },
        indicateur_source_metadonnee: {
          id: 1,
          sourceId: 'rare',
          dateVersion: DateTime.fromISO('2024-07-18T00:00:00.000Z').toJSDate(),
          nomDonnees: '',
          diffuseur: 'OREC',
          producteur: '',
          methodologie: 'Scope 1&2 (approche cadastrale)',
          limites: '',
        },
      };
      const indicateurValeur2: IndicateurValeurAvecMetadonnesDefinition = {
        indicateur_valeur: {
          id: 875,
          collectiviteId: 4936,
          indicateurId: 4,
          dateValeur: '2015-01-01',
          metadonneeId: 2,
          resultat: null,
          resultatCommentaire: null,
          objectif: 513790,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: DateTime.fromISO('2024-08-27T11:57:28.686Z').toJSDate(),
          createdAt: DateTime.fromISO('2024-08-27T11:57:28.686Z').toJSDate(),
          modifiedBy: null,
          createdBy: null,
        },
        indicateur_definition: {
          id: 4,
          groupementId: null,
          collectiviteId: null,
          identifiantReferentiel: 'cae_1.c',
          titre: 'Emissions de gaz à effet de serre - résidentiel',
          titreLong: 'Emissions de gaz à effet de serre du secteur résidentiel',
          description: '',
          unite: 'teq CO2',
          borneMin: null,
          borneMax: null,
          participationScore: false,
          sansValeurUtilisateur: false,
          valeurCalcule: null,
          modifiedAt: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
          createdAt: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
          modifiedBy: null,
          createdBy: null,
        },
        indicateur_source_metadonnee: {
          id: 2,
          sourceId: 'rare',
          dateVersion: DateTime.fromISO('2024-08-01T00:00:00.000Z').toJSDate(),
          nomDonnees: '',
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
        indicateurValeursDedoublonneesAttendues
      );

      // On inverse l'ordre des valeurs
      const indicateurValeursDedoublonnees2 =
        indicateurService.dedoublonnageIndicateurValeursParSource([
          indicateurValeur2,
          indicateurValeur1,
        ]);

      expect(indicateurValeursDedoublonnees2).toEqual(
        indicateurValeursDedoublonneesAttendues
      );
    });

    it("Doublon parfait, on en conserve qu'un", async () => {
      const indicateurValeur1: IndicateurValeurAvecMetadonnesDefinition = {
        indicateur_valeur: {
          id: 17,
          collectiviteId: 4936,
          indicateurId: 4,
          dateValeur: '2015-01-01',
          metadonneeId: 1,
          resultat: 447868,
          resultatCommentaire: null,
          objectif: null,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: DateTime.fromISO('2024-08-27T11:55:09.325Z').toJSDate(),
          createdAt: DateTime.fromISO('2024-08-27T11:55:09.325Z').toJSDate(),
          modifiedBy: null,
          createdBy: null,
        },
        indicateur_definition: {
          id: 4,
          groupementId: null,
          collectiviteId: null,
          identifiantReferentiel: 'cae_1.c',
          titre: 'Emissions de gaz à effet de serre - résidentiel',
          titreLong: 'Emissions de gaz à effet de serre du secteur résidentiel',
          description: '',
          unite: 'teq CO2',
          borneMin: null,
          borneMax: null,
          participationScore: false,
          sansValeurUtilisateur: false,
          valeurCalcule: null,
          modifiedAt: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
          createdAt: DateTime.fromISO('2024-08-27T11:54:51.791Z').toJSDate(),
          modifiedBy: null,
          createdBy: null,
        },
        indicateur_source_metadonnee: {
          id: 1,
          sourceId: 'rare',
          dateVersion: DateTime.fromISO('2024-07-18T00:00:00.000Z').toJSDate(),
          nomDonnees: '',
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
        indicateurValeursDedoublonneesAttendues
      );
    });
  });
});
