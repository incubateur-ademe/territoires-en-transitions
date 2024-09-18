import {
  CalculTrajectoireResponseType,
  CalculTrajectoireResultatMode,
} from '../../../src/indicateurs/models/calcultrajectoire.models';

export const trajectoireSnbcCalculRetour: CalculTrajectoireResponseType = {
  mode: CalculTrajectoireResultatMode.MAJ_SPREADSHEET_EXISTANT,
  source_donnees_entree: 'rare',
  indentifiants_referentiel_manquants_donnees_entree: [
    'cae_2.k',
    'cae_2.l_pcaet',
    'cae_63.ca',
    'cae_63.cb',
    'cae_63.da',
    'cae_63.cc',
    'cae_63.cd',
    'cae_63.db',
    'cae_63.b',
    'cae_63.e',
  ],
  trajectoire: {
    emissions_ges: [
      {
        definition: {
          id: 4,
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
            id: 14749,
            date_valeur: '2015-01-01',
            objectif: 513790,
          },
          {
            id: 14750,
            date_valeur: '2016-01-01',
            objectif: 527250,
          },
          {
            id: 14751,
            date_valeur: '2017-01-01',
            objectif: 526110,
          },
          {
            id: 14752,
            date_valeur: '2018-01-01',
            objectif: 520210,
          },
          {
            id: 14753,
            date_valeur: '2019-01-01',
            objectif: 515500,
          },
          {
            id: 14754,
            date_valeur: '2020-01-01',
            objectif: 510140,
          },
          {
            id: 14755,
            date_valeur: '2021-01-01',
            objectif: 488690,
          },
          {
            id: 14756,
            date_valeur: '2022-01-01',
            objectif: 466220,
          },
          {
            id: 14757,
            date_valeur: '2023-01-01',
            objectif: 443710,
          },
          {
            id: 14758,
            date_valeur: '2024-01-01',
            objectif: 420870,
          },
          {
            id: 14759,
            date_valeur: '2025-01-01',
            objectif: 398190,
          },
          {
            id: 14760,
            date_valeur: '2026-01-01',
            objectif: 381200,
          },
          {
            id: 14761,
            date_valeur: '2027-01-01',
            objectif: 364500,
          },
          {
            id: 14762,
            date_valeur: '2028-01-01',
            objectif: 347280,
          },
          {
            id: 14763,
            date_valeur: '2029-01-01',
            objectif: 329840,
          },
          {
            id: 14764,
            date_valeur: '2030-01-01',
            objectif: 311380,
          },
          {
            id: 14765,
            date_valeur: '2031-01-01',
            objectif: 302470,
          },
          {
            id: 14766,
            date_valeur: '2032-01-01',
            objectif: 292770,
          },
          {
            id: 14767,
            date_valeur: '2033-01-01',
            objectif: 281950,
          },
          {
            id: 14768,
            date_valeur: '2034-01-01',
            objectif: 270600,
          },
          {
            id: 14769,
            date_valeur: '2035-01-01',
            objectif: 258270,
          },
          {
            id: 14770,
            date_valeur: '2036-01-01',
            objectif: 245330,
          },
          {
            id: 14771,
            date_valeur: '2037-01-01',
            objectif: 231730,
          },
          {
            id: 14772,
            date_valeur: '2038-01-01',
            objectif: 218320,
          },
          {
            id: 14773,
            date_valeur: '2039-01-01',
            objectif: 204290,
          },
          {
            id: 14774,
            date_valeur: '2040-01-01',
            objectif: 189440,
          },
          {
            id: 14775,
            date_valeur: '2041-01-01',
            objectif: 174160,
          },
          {
            id: 14776,
            date_valeur: '2042-01-01',
            objectif: 158870,
          },
          {
            id: 14777,
            date_valeur: '2043-01-01',
            objectif: 143280,
          },
          {
            id: 14778,
            date_valeur: '2044-01-01',
            objectif: 127750,
          },
          {
            id: 14779,
            date_valeur: '2045-01-01',
            objectif: 112070,
          },
          {
            id: 14780,
            date_valeur: '2046-01-01',
            objectif: 96210,
          },
          {
            id: 14781,
            date_valeur: '2047-01-01',
            objectif: 80210,
          },
          {
            id: 14782,
            date_valeur: '2048-01-01',
            objectif: 64090,
          },
          {
            id: 14783,
            date_valeur: '2049-01-01',
            objectif: 47750,
          },
          {
            id: 14784,
            date_valeur: '2050-01-01',
            objectif: 31190,
          },
        ],
      },
      {
        definition: {
          id: 5,
          identifiant_referentiel: 'cae_1.ca',
          titre:
            'Emissions de gaz à effet de serre - résidentiel - Chauffage / Maisons individuelles',
          titre_long:
            'Emissions de gaz à effet de serre secteur Résidentiel - Chauffage / Maisons individuelles',
          description: '',
          unite: 'teq CO2',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 13921,
            date_valeur: '2015-01-01',
            objectif: 154100,
          },
          {
            id: 13922,
            date_valeur: '2016-01-01',
            objectif: 159400,
          },
          {
            id: 13923,
            date_valeur: '2017-01-01',
            objectif: 160300,
          },
          {
            id: 13924,
            date_valeur: '2018-01-01',
            objectif: 158200,
          },
          {
            id: 13925,
            date_valeur: '2019-01-01',
            objectif: 156500,
          },
          {
            id: 13926,
            date_valeur: '2020-01-01',
            objectif: 154600,
          },
          {
            id: 13927,
            date_valeur: '2021-01-01',
            objectif: 147700,
          },
          {
            id: 13928,
            date_valeur: '2022-01-01',
            objectif: 140600,
          },
          {
            id: 13929,
            date_valeur: '2023-01-01',
            objectif: 133400,
          },
          {
            id: 13930,
            date_valeur: '2024-01-01',
            objectif: 126000,
          },
          {
            id: 13931,
            date_valeur: '2025-01-01',
            objectif: 118300,
          },
          {
            id: 13932,
            date_valeur: '2026-01-01',
            objectif: 112200,
          },
          {
            id: 13933,
            date_valeur: '2027-01-01',
            objectif: 105900,
          },
          {
            id: 13934,
            date_valeur: '2028-01-01',
            objectif: 99500,
          },
          {
            id: 13935,
            date_valeur: '2029-01-01',
            objectif: 93000,
          },
          {
            id: 13936,
            date_valeur: '2030-01-01',
            objectif: 86500,
          },
          {
            id: 13937,
            date_valeur: '2031-01-01',
            objectif: 83500,
          },
          {
            id: 13938,
            date_valeur: '2032-01-01',
            objectif: 80400,
          },
          {
            id: 13939,
            date_valeur: '2033-01-01',
            objectif: 77300,
          },
          {
            id: 13940,
            date_valeur: '2034-01-01',
            objectif: 74200,
          },
          {
            id: 13941,
            date_valeur: '2035-01-01',
            objectif: 71100,
          },
          {
            id: 13942,
            date_valeur: '2036-01-01',
            objectif: 68000,
          },
          {
            id: 13943,
            date_valeur: '2037-01-01',
            objectif: 64700,
          },
          {
            id: 13944,
            date_valeur: '2038-01-01',
            objectif: 61300,
          },
          {
            id: 13945,
            date_valeur: '2039-01-01',
            objectif: 57700,
          },
          {
            id: 13946,
            date_valeur: '2040-01-01',
            objectif: 54200,
          },
          {
            id: 13947,
            date_valeur: '2041-01-01',
            objectif: 50500,
          },
          {
            id: 13948,
            date_valeur: '2042-01-01',
            objectif: 46700,
          },
          {
            id: 13949,
            date_valeur: '2043-01-01',
            objectif: 42700,
          },
          {
            id: 13950,
            date_valeur: '2044-01-01',
            objectif: 38500,
          },
          {
            id: 13951,
            date_valeur: '2045-01-01',
            objectif: 34100,
          },
          {
            id: 13952,
            date_valeur: '2046-01-01',
            objectif: 29600,
          },
          {
            id: 13953,
            date_valeur: '2047-01-01',
            objectif: 24900,
          },
          {
            id: 13954,
            date_valeur: '2048-01-01',
            objectif: 20000,
          },
          {
            id: 13955,
            date_valeur: '2049-01-01',
            objectif: 15000,
          },
          {
            id: 13956,
            date_valeur: '2050-01-01',
            objectif: 9900,
          },
        ],
      },
      {
        definition: {
          id: 6,
          identifiant_referentiel: 'cae_1.cb',
          titre:
            'Emissions de gaz à effet de serre - résidentiel - Chauffage / Logement collectif',
          titre_long:
            'Emissions de gaz à effet de serre secteur Résidentiel - Chauffage / Logement collectif',
          description: '',
          unite: 'teq CO2',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 13957,
            date_valeur: '2015-01-01',
            objectif: 301600,
          },
          {
            id: 13958,
            date_valeur: '2016-01-01',
            objectif: 308100,
          },
          {
            id: 13959,
            date_valeur: '2017-01-01',
            objectif: 305900,
          },
          {
            id: 13960,
            date_valeur: '2018-01-01',
            objectif: 302800,
          },
          {
            id: 13961,
            date_valeur: '2019-01-01',
            objectif: 300400,
          },
          {
            id: 13962,
            date_valeur: '2020-01-01',
            objectif: 297600,
          },
          {
            id: 13963,
            date_valeur: '2021-01-01',
            objectif: 285600,
          },
          {
            id: 13964,
            date_valeur: '2022-01-01',
            objectif: 272800,
          },
          {
            id: 13965,
            date_valeur: '2023-01-01',
            objectif: 260100,
          },
          {
            id: 13966,
            date_valeur: '2024-01-01',
            objectif: 247400,
          },
          {
            id: 13967,
            date_valeur: '2025-01-01',
            objectif: 235100,
          },
          {
            id: 13968,
            date_valeur: '2026-01-01',
            objectif: 226400,
          },
          {
            id: 13969,
            date_valeur: '2027-01-01',
            objectif: 218100,
          },
          {
            id: 13970,
            date_valeur: '2028-01-01',
            objectif: 209600,
          },
          {
            id: 13971,
            date_valeur: '2029-01-01',
            objectif: 200800,
          },
          {
            id: 13972,
            date_valeur: '2030-01-01',
            objectif: 191100,
          },
          {
            id: 13973,
            date_valeur: '2031-01-01',
            objectif: 188100,
          },
          {
            id: 13974,
            date_valeur: '2032-01-01',
            objectif: 184200,
          },
          {
            id: 13975,
            date_valeur: '2033-01-01',
            objectif: 179100,
          },
          {
            id: 13976,
            date_valeur: '2034-01-01',
            objectif: 173300,
          },
          {
            id: 13977,
            date_valeur: '2035-01-01',
            objectif: 166600,
          },
          {
            id: 13978,
            date_valeur: '2036-01-01',
            objectif: 159100,
          },
          {
            id: 13979,
            date_valeur: '2037-01-01',
            objectif: 151000,
          },
          {
            id: 13980,
            date_valeur: '2038-01-01',
            objectif: 143100,
          },
          {
            id: 13981,
            date_valeur: '2039-01-01',
            objectif: 134600,
          },
          {
            id: 13982,
            date_valeur: '2040-01-01',
            objectif: 125100,
          },
          {
            id: 13983,
            date_valeur: '2041-01-01',
            objectif: 115300,
          },
          {
            id: 13984,
            date_valeur: '2042-01-01',
            objectif: 105300,
          },
          {
            id: 13985,
            date_valeur: '2043-01-01',
            objectif: 95200,
          },
          {
            id: 13986,
            date_valeur: '2044-01-01',
            objectif: 85100,
          },
          {
            id: 13987,
            date_valeur: '2045-01-01',
            objectif: 74900,
          },
          {
            id: 13988,
            date_valeur: '2046-01-01',
            objectif: 64500,
          },
          {
            id: 13989,
            date_valeur: '2047-01-01',
            objectif: 54000,
          },
          {
            id: 13990,
            date_valeur: '2048-01-01',
            objectif: 43400,
          },
          {
            id: 13991,
            date_valeur: '2049-01-01',
            objectif: 32500,
          },
          {
            id: 13992,
            date_valeur: '2050-01-01',
            objectif: 21300,
          },
        ],
      },
      {
        definition: {
          id: 7,
          identifiant_referentiel: 'cae_1.cc',
          titre:
            'Emissions de gaz à effet de serre - résidentiel - Autres usages',
          titre_long:
            'Emissions de gaz à effet de serre secteur Résidentiel - Autres usages',
          description: '',
          unite: 'teq CO2',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 13993,
            date_valeur: '2015-01-01',
            objectif: 58000,
          },
          {
            id: 13994,
            date_valeur: '2016-01-01',
            objectif: 59800,
          },
          {
            id: 13995,
            date_valeur: '2017-01-01',
            objectif: 60000,
          },
          {
            id: 13996,
            date_valeur: '2018-01-01',
            objectif: 59200,
          },
          {
            id: 13997,
            date_valeur: '2019-01-01',
            objectif: 58600,
          },
          {
            id: 13998,
            date_valeur: '2020-01-01',
            objectif: 58000,
          },
          {
            id: 13999,
            date_valeur: '2021-01-01',
            objectif: 55400,
          },
          {
            id: 14000,
            date_valeur: '2022-01-01',
            objectif: 52800,
          },
          {
            id: 14001,
            date_valeur: '2023-01-01',
            objectif: 50200,
          },
          {
            id: 14002,
            date_valeur: '2024-01-01',
            objectif: 47500,
          },
          {
            id: 14003,
            date_valeur: '2025-01-01',
            objectif: 44700,
          },
          {
            id: 14004,
            date_valeur: '2026-01-01',
            objectif: 42600,
          },
          {
            id: 14005,
            date_valeur: '2027-01-01',
            objectif: 40400,
          },
          {
            id: 14006,
            date_valeur: '2028-01-01',
            objectif: 38200,
          },
          {
            id: 14007,
            date_valeur: '2029-01-01',
            objectif: 36000,
          },
          {
            id: 14008,
            date_valeur: '2030-01-01',
            objectif: 33700,
          },
          {
            id: 14009,
            date_valeur: '2031-01-01',
            objectif: 30900,
          },
          {
            id: 14010,
            date_valeur: '2032-01-01',
            objectif: 28200,
          },
          {
            id: 14011,
            date_valeur: '2033-01-01',
            objectif: 25500,
          },
          {
            id: 14012,
            date_valeur: '2034-01-01',
            objectif: 23000,
          },
          {
            id: 14013,
            date_valeur: '2035-01-01',
            objectif: 20600,
          },
          {
            id: 14014,
            date_valeur: '2036-01-01',
            objectif: 18300,
          },
          {
            id: 14015,
            date_valeur: '2037-01-01',
            objectif: 16000,
          },
          {
            id: 14016,
            date_valeur: '2038-01-01',
            objectif: 13900,
          },
          {
            id: 14017,
            date_valeur: '2039-01-01',
            objectif: 12000,
          },
          {
            id: 14018,
            date_valeur: '2040-01-01',
            objectif: 10100,
          },
          {
            id: 14019,
            date_valeur: '2041-01-01',
            objectif: 8400,
          },
          {
            id: 14020,
            date_valeur: '2042-01-01',
            objectif: 6900,
          },
          {
            id: 14021,
            date_valeur: '2043-01-01',
            objectif: 5400,
          },
          {
            id: 14022,
            date_valeur: '2044-01-01',
            objectif: 4200,
          },
          {
            id: 14023,
            date_valeur: '2045-01-01',
            objectif: 3100,
          },
          {
            id: 14024,
            date_valeur: '2046-01-01',
            objectif: 2100,
          },
          {
            id: 14025,
            date_valeur: '2047-01-01',
            objectif: 1300,
          },
          {
            id: 14026,
            date_valeur: '2048-01-01',
            objectif: 700,
          },
          {
            id: 14027,
            date_valeur: '2049-01-01',
            objectif: 300,
          },
          {
            id: 14028,
            date_valeur: '2050-01-01',
            objectif: 0,
          },
        ],
      },
      {
        definition: {
          id: 9,
          identifiant_referentiel: 'cae_1.d',
          titre: 'Emissions de gaz à effet de serre - tertiaire',
          titre_long: 'Emissions de gaz à effet de serre du secteur tertiaire',
          description: '',
          unite: 'teq CO2',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 14785,
            date_valeur: '2015-01-01',
            objectif: 451040,
          },
          {
            id: 14786,
            date_valeur: '2016-01-01',
            objectif: 423080,
          },
          {
            id: 14787,
            date_valeur: '2017-01-01',
            objectif: 419680,
          },
          {
            id: 14788,
            date_valeur: '2018-01-01',
            objectif: 410230,
          },
          {
            id: 14789,
            date_valeur: '2019-01-01',
            objectif: 401770,
          },
          {
            id: 14790,
            date_valeur: '2020-01-01',
            objectif: 393000,
          },
          {
            id: 14791,
            date_valeur: '2021-01-01',
            objectif: 368050,
          },
          {
            id: 14792,
            date_valeur: '2022-01-01',
            objectif: 343330,
          },
          {
            id: 14793,
            date_valeur: '2023-01-01',
            objectif: 319230,
          },
          {
            id: 14794,
            date_valeur: '2024-01-01',
            objectif: 295580,
          },
          {
            id: 14795,
            date_valeur: '2025-01-01',
            objectif: 272470,
          },
          {
            id: 14796,
            date_valeur: '2026-01-01',
            objectif: 253530,
          },
          {
            id: 14797,
            date_valeur: '2027-01-01',
            objectif: 235240,
          },
          {
            id: 14798,
            date_valeur: '2028-01-01',
            objectif: 217200,
          },
          {
            id: 14799,
            date_valeur: '2029-01-01',
            objectif: 199780,
          },
          {
            id: 14800,
            date_valeur: '2030-01-01',
            objectif: 182650,
          },
          {
            id: 14801,
            date_valeur: '2031-01-01',
            objectif: 169050,
          },
          {
            id: 14802,
            date_valeur: '2032-01-01',
            objectif: 155970,
          },
          {
            id: 14803,
            date_valeur: '2033-01-01',
            objectif: 143260,
          },
          {
            id: 14804,
            date_valeur: '2034-01-01',
            objectif: 131200,
          },
          {
            id: 14805,
            date_valeur: '2035-01-01',
            objectif: 119520,
          },
          {
            id: 14806,
            date_valeur: '2036-01-01',
            objectif: 108360,
          },
          {
            id: 14807,
            date_valeur: '2037-01-01',
            objectif: 97660,
          },
          {
            id: 14808,
            date_valeur: '2038-01-01',
            objectif: 87550,
          },
          {
            id: 14809,
            date_valeur: '2039-01-01',
            objectif: 77880,
          },
          {
            id: 14810,
            date_valeur: '2040-01-01',
            objectif: 68750,
          },
          {
            id: 14811,
            date_valeur: '2041-01-01',
            objectif: 60090,
          },
          {
            id: 14812,
            date_valeur: '2042-01-01',
            objectif: 52000,
          },
          {
            id: 14813,
            date_valeur: '2043-01-01',
            objectif: 44400,
          },
          {
            id: 14814,
            date_valeur: '2044-01-01',
            objectif: 37330,
          },
          {
            id: 14815,
            date_valeur: '2045-01-01',
            objectif: 30780,
          },
          {
            id: 14816,
            date_valeur: '2046-01-01',
            objectif: 24760,
          },
          {
            id: 14817,
            date_valeur: '2047-01-01',
            objectif: 19240,
          },
          {
            id: 14818,
            date_valeur: '2048-01-01',
            objectif: 14250,
          },
          {
            id: 14819,
            date_valeur: '2049-01-01',
            objectif: 9800,
          },
          {
            id: 14820,
            date_valeur: '2050-01-01',
            objectif: 5870,
          },
        ],
      },
      {
        definition: {
          id: 10,
          identifiant_referentiel: 'cae_1.da',
          titre: 'Emissions de gaz à effet de serre - tertiaire - Chauffage',
          titre_long:
            'Emissions de gaz à effet de serre secteur Tertiaire - Chauffage',
          description: '',
          unite: 'teq CO2',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 14029,
            date_valeur: '2015-01-01',
            objectif: 391500,
          },
          {
            id: 14030,
            date_valeur: '2016-01-01',
            objectif: 367200,
          },
          {
            id: 14031,
            date_valeur: '2017-01-01',
            objectif: 364300,
          },
          {
            id: 14032,
            date_valeur: '2018-01-01',
            objectif: 356100,
          },
          {
            id: 14033,
            date_valeur: '2019-01-01',
            objectif: 348700,
          },
          {
            id: 14034,
            date_valeur: '2020-01-01',
            objectif: 341100,
          },
          {
            id: 14035,
            date_valeur: '2021-01-01',
            objectif: 319500,
          },
          {
            id: 14036,
            date_valeur: '2022-01-01',
            objectif: 298000,
          },
          {
            id: 14037,
            date_valeur: '2023-01-01',
            objectif: 277100,
          },
          {
            id: 14038,
            date_valeur: '2024-01-01',
            objectif: 256600,
          },
          {
            id: 14039,
            date_valeur: '2025-01-01',
            objectif: 236500,
          },
          {
            id: 14040,
            date_valeur: '2026-01-01',
            objectif: 220100,
          },
          {
            id: 14041,
            date_valeur: '2027-01-01',
            objectif: 204200,
          },
          {
            id: 14042,
            date_valeur: '2028-01-01',
            objectif: 188500,
          },
          {
            id: 14043,
            date_valeur: '2029-01-01',
            objectif: 173400,
          },
          {
            id: 14044,
            date_valeur: '2030-01-01',
            objectif: 158500,
          },
          {
            id: 14045,
            date_valeur: '2031-01-01',
            objectif: 147900,
          },
          {
            id: 14046,
            date_valeur: '2032-01-01',
            objectif: 137500,
          },
          {
            id: 14047,
            date_valeur: '2033-01-01',
            objectif: 127200,
          },
          {
            id: 14048,
            date_valeur: '2034-01-01',
            objectif: 117400,
          },
          {
            id: 14049,
            date_valeur: '2035-01-01',
            objectif: 107800,
          },
          {
            id: 14050,
            date_valeur: '2036-01-01',
            objectif: 98400,
          },
          {
            id: 14051,
            date_valeur: '2037-01-01',
            objectif: 89300,
          },
          {
            id: 14052,
            date_valeur: '2038-01-01',
            objectif: 80700,
          },
          {
            id: 14053,
            date_valeur: '2039-01-01',
            objectif: 72300,
          },
          {
            id: 14054,
            date_valeur: '2040-01-01',
            objectif: 64300,
          },
          {
            id: 14055,
            date_valeur: '2041-01-01',
            objectif: 56600,
          },
          {
            id: 14056,
            date_valeur: '2042-01-01',
            objectif: 49300,
          },
          {
            id: 14057,
            date_valeur: '2043-01-01',
            objectif: 42400,
          },
          {
            id: 14058,
            date_valeur: '2044-01-01',
            objectif: 35900,
          },
          {
            id: 14059,
            date_valeur: '2045-01-01',
            objectif: 29800,
          },
          {
            id: 14060,
            date_valeur: '2046-01-01',
            objectif: 24100,
          },
          {
            id: 14061,
            date_valeur: '2047-01-01',
            objectif: 18900,
          },
          {
            id: 14062,
            date_valeur: '2048-01-01',
            objectif: 14100,
          },
          {
            id: 14063,
            date_valeur: '2049-01-01',
            objectif: 9700,
          },
          {
            id: 14064,
            date_valeur: '2050-01-01',
            objectif: 5900,
          },
        ],
      },
      {
        definition: {
          id: 11,
          identifiant_referentiel: 'cae_1.db',
          titre:
            'Emissions de gaz à effet de serre - tertiaire - Autres usages',
          titre_long:
            'Emissions de gaz à effet de serre secteur Tertiaire - Autres usages',
          description: '',
          unite: 'teq CO2',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 14065,
            date_valeur: '2015-01-01',
            objectif: 59500,
          },
          {
            id: 14066,
            date_valeur: '2016-01-01',
            objectif: 55900,
          },
          {
            id: 14067,
            date_valeur: '2017-01-01',
            objectif: 55400,
          },
          {
            id: 14068,
            date_valeur: '2018-01-01',
            objectif: 54200,
          },
          {
            id: 14069,
            date_valeur: '2019-01-01',
            objectif: 53000,
          },
          {
            id: 14070,
            date_valeur: '2020-01-01',
            objectif: 51900,
          },
          {
            id: 14071,
            date_valeur: '2021-01-01',
            objectif: 48600,
          },
          {
            id: 14072,
            date_valeur: '2022-01-01',
            objectif: 45300,
          },
          {
            id: 14073,
            date_valeur: '2023-01-01',
            objectif: 42100,
          },
          {
            id: 14074,
            date_valeur: '2024-01-01',
            objectif: 39000,
          },
          {
            id: 14075,
            date_valeur: '2025-01-01',
            objectif: 36000,
          },
          {
            id: 14076,
            date_valeur: '2026-01-01',
            objectif: 33500,
          },
          {
            id: 14077,
            date_valeur: '2027-01-01',
            objectif: 31100,
          },
          {
            id: 14078,
            date_valeur: '2028-01-01',
            objectif: 28700,
          },
          {
            id: 14079,
            date_valeur: '2029-01-01',
            objectif: 26400,
          },
          {
            id: 14080,
            date_valeur: '2030-01-01',
            objectif: 24100,
          },
          {
            id: 14081,
            date_valeur: '2031-01-01',
            objectif: 21200,
          },
          {
            id: 14082,
            date_valeur: '2032-01-01',
            objectif: 18500,
          },
          {
            id: 14083,
            date_valeur: '2033-01-01',
            objectif: 16000,
          },
          {
            id: 14084,
            date_valeur: '2034-01-01',
            objectif: 13800,
          },
          {
            id: 14085,
            date_valeur: '2035-01-01',
            objectif: 11800,
          },
          {
            id: 14086,
            date_valeur: '2036-01-01',
            objectif: 9900,
          },
          {
            id: 14087,
            date_valeur: '2037-01-01',
            objectif: 8300,
          },
          {
            id: 14088,
            date_valeur: '2038-01-01',
            objectif: 6900,
          },
          {
            id: 14089,
            date_valeur: '2039-01-01',
            objectif: 5600,
          },
          {
            id: 14090,
            date_valeur: '2040-01-01',
            objectif: 4500,
          },
          {
            id: 14091,
            date_valeur: '2041-01-01',
            objectif: 3500,
          },
          {
            id: 14092,
            date_valeur: '2042-01-01',
            objectif: 2700,
          },
          {
            id: 14093,
            date_valeur: '2043-01-01',
            objectif: 2000,
          },
          {
            id: 14094,
            date_valeur: '2044-01-01',
            objectif: 1500,
          },
          {
            id: 14095,
            date_valeur: '2045-01-01',
            objectif: 1000,
          },
          {
            id: 14096,
            date_valeur: '2046-01-01',
            objectif: 600,
          },
          {
            id: 14097,
            date_valeur: '2047-01-01',
            objectif: 400,
          },
          {
            id: 14098,
            date_valeur: '2048-01-01',
            objectif: 200,
          },
          {
            id: 14099,
            date_valeur: '2049-01-01',
            objectif: 100,
          },
          {
            id: 14100,
            date_valeur: '2050-01-01',
            objectif: 0,
          },
        ],
      },
      {
        definition: {
          id: 13,
          identifiant_referentiel: 'cae_1.ea',
          titre:
            'Emissions de gaz à effet de serre - Transport routier - mobilité locale',
          titre_long:
            'Emissions de gaz à effet de serre secteur Transport routier - mobilité locale',
          description: '',
          unite: 'teq CO2',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 14461,
            date_valeur: '2015-01-01',
            objectif: 228600,
          },
          {
            id: 14462,
            date_valeur: '2016-01-01',
            objectif: 229300,
          },
          {
            id: 14463,
            date_valeur: '2017-01-01',
            objectif: 226500,
          },
          {
            id: 14464,
            date_valeur: '2018-01-01',
            objectif: 223700,
          },
          {
            id: 14465,
            date_valeur: '2019-01-01',
            objectif: 221300,
          },
          {
            id: 14466,
            date_valeur: '2020-01-01',
            objectif: 218800,
          },
          {
            id: 14467,
            date_valeur: '2021-01-01',
            objectif: 213700,
          },
          {
            id: 14468,
            date_valeur: '2022-01-01',
            objectif: 208500,
          },
          {
            id: 14469,
            date_valeur: '2023-01-01',
            objectif: 203300,
          },
          {
            id: 14470,
            date_valeur: '2024-01-01',
            objectif: 198100,
          },
          {
            id: 14471,
            date_valeur: '2025-01-01',
            objectif: 192800,
          },
          {
            id: 14472,
            date_valeur: '2026-01-01',
            objectif: 187000,
          },
          {
            id: 14473,
            date_valeur: '2027-01-01',
            objectif: 181200,
          },
          {
            id: 14474,
            date_valeur: '2028-01-01',
            objectif: 175400,
          },
          {
            id: 14475,
            date_valeur: '2029-01-01',
            objectif: 169600,
          },
          {
            id: 14476,
            date_valeur: '2030-01-01',
            objectif: 163700,
          },
          {
            id: 14477,
            date_valeur: '2031-01-01',
            objectif: 155800,
          },
          {
            id: 14478,
            date_valeur: '2032-01-01',
            objectif: 147900,
          },
          {
            id: 14479,
            date_valeur: '2033-01-01',
            objectif: 139900,
          },
          {
            id: 14480,
            date_valeur: '2034-01-01',
            objectif: 132000,
          },
          {
            id: 14481,
            date_valeur: '2035-01-01',
            objectif: 123900,
          },
          {
            id: 14482,
            date_valeur: '2036-01-01',
            objectif: 115900,
          },
          {
            id: 14483,
            date_valeur: '2037-01-01',
            objectif: 107700,
          },
          {
            id: 14484,
            date_valeur: '2038-01-01',
            objectif: 99700,
          },
          {
            id: 14485,
            date_valeur: '2039-01-01',
            objectif: 91500,
          },
          {
            id: 14486,
            date_valeur: '2040-01-01',
            objectif: 83400,
          },
          {
            id: 14487,
            date_valeur: '2041-01-01',
            objectif: 75200,
          },
          {
            id: 14488,
            date_valeur: '2042-01-01',
            objectif: 67000,
          },
          {
            id: 14489,
            date_valeur: '2043-01-01',
            objectif: 58800,
          },
          {
            id: 14490,
            date_valeur: '2044-01-01',
            objectif: 50600,
          },
          {
            id: 14491,
            date_valeur: '2045-01-01',
            objectif: 42400,
          },
          {
            id: 14492,
            date_valeur: '2046-01-01',
            objectif: 34100,
          },
          {
            id: 14493,
            date_valeur: '2047-01-01',
            objectif: 25900,
          },
          {
            id: 14494,
            date_valeur: '2048-01-01',
            objectif: 17700,
          },
          {
            id: 14495,
            date_valeur: '2049-01-01',
            objectif: 9400,
          },
          {
            id: 14496,
            date_valeur: '2050-01-01',
            objectif: 1200,
          },
        ],
      },
      {
        definition: {
          id: 14,
          identifiant_referentiel: 'cae_1.eb',
          titre:
            'Emissions de gaz à effet de serre - Transport routier - autre',
          titre_long:
            'Emissions de gaz à effet de serre secteur Transport routier - autre',
          description: '',
          unite: 'teq CO2',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 14497,
            date_valeur: '2015-01-01',
            objectif: 425000,
          },
          {
            id: 14498,
            date_valeur: '2016-01-01',
            objectif: 426400,
          },
          {
            id: 14499,
            date_valeur: '2017-01-01',
            objectif: 421100,
          },
          {
            id: 14500,
            date_valeur: '2018-01-01',
            objectif: 415800,
          },
          {
            id: 14501,
            date_valeur: '2019-01-01',
            objectif: 410500,
          },
          {
            id: 14502,
            date_valeur: '2020-01-01',
            objectif: 405200,
          },
          {
            id: 14503,
            date_valeur: '2021-01-01',
            objectif: 394900,
          },
          {
            id: 14504,
            date_valeur: '2022-01-01',
            objectif: 384600,
          },
          {
            id: 14505,
            date_valeur: '2023-01-01',
            objectif: 374200,
          },
          {
            id: 14506,
            date_valeur: '2024-01-01',
            objectif: 363900,
          },
          {
            id: 14507,
            date_valeur: '2025-01-01',
            objectif: 353500,
          },
          {
            id: 14508,
            date_valeur: '2026-01-01',
            objectif: 342400,
          },
          {
            id: 14509,
            date_valeur: '2027-01-01',
            objectif: 331200,
          },
          {
            id: 14510,
            date_valeur: '2028-01-01',
            objectif: 320100,
          },
          {
            id: 14511,
            date_valeur: '2029-01-01',
            objectif: 308900,
          },
          {
            id: 14512,
            date_valeur: '2030-01-01',
            objectif: 297800,
          },
          {
            id: 14513,
            date_valeur: '2031-01-01',
            objectif: 283000,
          },
          {
            id: 14514,
            date_valeur: '2032-01-01',
            objectif: 268200,
          },
          {
            id: 14515,
            date_valeur: '2033-01-01',
            objectif: 253400,
          },
          {
            id: 14516,
            date_valeur: '2034-01-01',
            objectif: 238600,
          },
          {
            id: 14517,
            date_valeur: '2035-01-01',
            objectif: 223800,
          },
          {
            id: 14518,
            date_valeur: '2036-01-01',
            objectif: 209100,
          },
          {
            id: 14519,
            date_valeur: '2037-01-01',
            objectif: 194300,
          },
          {
            id: 14520,
            date_valeur: '2038-01-01',
            objectif: 179500,
          },
          {
            id: 14521,
            date_valeur: '2039-01-01',
            objectif: 164700,
          },
          {
            id: 14522,
            date_valeur: '2040-01-01',
            objectif: 149900,
          },
          {
            id: 14523,
            date_valeur: '2041-01-01',
            objectif: 135200,
          },
          {
            id: 14524,
            date_valeur: '2042-01-01',
            objectif: 120400,
          },
          {
            id: 14525,
            date_valeur: '2043-01-01',
            objectif: 105600,
          },
          {
            id: 14526,
            date_valeur: '2044-01-01',
            objectif: 90800,
          },
          {
            id: 14527,
            date_valeur: '2045-01-01',
            objectif: 76000,
          },
          {
            id: 14528,
            date_valeur: '2046-01-01',
            objectif: 61300,
          },
          {
            id: 14529,
            date_valeur: '2047-01-01',
            objectif: 46500,
          },
          {
            id: 14530,
            date_valeur: '2048-01-01',
            objectif: 31700,
          },
          {
            id: 14531,
            date_valeur: '2049-01-01',
            objectif: 16900,
          },
          {
            id: 14532,
            date_valeur: '2050-01-01',
            objectif: 2100,
          },
        ],
      },
      {
        definition: {
          id: 15,
          identifiant_referentiel: 'cae_1.f',
          titre: 'Emissions de gaz à effet de serre - "autres transports"',
          titre_long:
            'Emissions de gaz à effet de serre du secteur des autres transport (hors routier)',
          description: '',
          unite: 'teq CO2',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 14533,
            date_valeur: '2015-01-01',
            objectif: 21500,
          },
          {
            id: 14534,
            date_valeur: '2016-01-01',
            objectif: 18500,
          },
          {
            id: 14535,
            date_valeur: '2017-01-01',
            objectif: 19900,
          },
          {
            id: 14536,
            date_valeur: '2018-01-01',
            objectif: 21400,
          },
          {
            id: 14537,
            date_valeur: '2019-01-01',
            objectif: 22800,
          },
          {
            id: 14538,
            date_valeur: '2020-01-01',
            objectif: 24200,
          },
          {
            id: 14539,
            date_valeur: '2021-01-01',
            objectif: 23900,
          },
          {
            id: 14540,
            date_valeur: '2022-01-01',
            objectif: 23500,
          },
          {
            id: 14541,
            date_valeur: '2023-01-01',
            objectif: 23100,
          },
          {
            id: 14542,
            date_valeur: '2024-01-01',
            objectif: 22600,
          },
          {
            id: 14543,
            date_valeur: '2025-01-01',
            objectif: 22200,
          },
          {
            id: 14544,
            date_valeur: '2026-01-01',
            objectif: 22100,
          },
          {
            id: 14545,
            date_valeur: '2027-01-01',
            objectif: 22000,
          },
          {
            id: 14546,
            date_valeur: '2028-01-01',
            objectif: 22000,
          },
          {
            id: 14547,
            date_valeur: '2029-01-01',
            objectif: 21900,
          },
          {
            id: 14548,
            date_valeur: '2030-01-01',
            objectif: 21800,
          },
          {
            id: 14549,
            date_valeur: '2031-01-01',
            objectif: 19700,
          },
          {
            id: 14550,
            date_valeur: '2032-01-01',
            objectif: 17700,
          },
          {
            id: 14551,
            date_valeur: '2033-01-01',
            objectif: 15800,
          },
          {
            id: 14552,
            date_valeur: '2034-01-01',
            objectif: 14100,
          },
          {
            id: 14553,
            date_valeur: '2035-01-01',
            objectif: 12500,
          },
          {
            id: 14554,
            date_valeur: '2036-01-01',
            objectif: 11000,
          },
          {
            id: 14555,
            date_valeur: '2037-01-01',
            objectif: 9700,
          },
          {
            id: 14556,
            date_valeur: '2038-01-01',
            objectif: 8500,
          },
          {
            id: 14557,
            date_valeur: '2039-01-01',
            objectif: 7500,
          },
          {
            id: 14558,
            date_valeur: '2040-01-01',
            objectif: 6600,
          },
          {
            id: 14559,
            date_valeur: '2041-01-01',
            objectif: 5800,
          },
          {
            id: 14560,
            date_valeur: '2042-01-01',
            objectif: 5200,
          },
          {
            id: 14561,
            date_valeur: '2043-01-01',
            objectif: 4700,
          },
          {
            id: 14562,
            date_valeur: '2044-01-01',
            objectif: 4400,
          },
          {
            id: 14563,
            date_valeur: '2045-01-01',
            objectif: 4100,
          },
          {
            id: 14564,
            date_valeur: '2046-01-01',
            objectif: 4100,
          },
          {
            id: 14565,
            date_valeur: '2047-01-01',
            objectif: 4100,
          },
          {
            id: 14566,
            date_valeur: '2048-01-01',
            objectif: 4400,
          },
          {
            id: 14567,
            date_valeur: '2049-01-01',
            objectif: 4700,
          },
          {
            id: 14568,
            date_valeur: '2050-01-01',
            objectif: 5200,
          },
        ],
      },
      {
        definition: {
          id: 16,
          identifiant_referentiel: 'cae_1.g',
          titre: 'Emissions de gaz à effet de serre - agriculture',
          titre_long:
            "Emissions de gaz à effet de serre du secteur de l'agriculture",
          description: '',
          unite: 'teq CO2',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 14857,
            date_valeur: '2015-01-01',
            objectif: 35300,
          },
          {
            id: 14858,
            date_valeur: '2016-01-01',
            objectif: 34910,
          },
          {
            id: 14859,
            date_valeur: '2017-01-01',
            objectif: 34500,
          },
          {
            id: 14860,
            date_valeur: '2018-01-01',
            objectif: 34100,
          },
          {
            id: 14861,
            date_valeur: '2019-01-01',
            objectif: 33690,
          },
          {
            id: 14862,
            date_valeur: '2020-01-01',
            objectif: 33280,
          },
          {
            id: 14863,
            date_valeur: '2021-01-01',
            objectif: 32780,
          },
          {
            id: 14864,
            date_valeur: '2022-01-01',
            objectif: 32280,
          },
          {
            id: 14865,
            date_valeur: '2023-01-01',
            objectif: 31780,
          },
          {
            id: 14866,
            date_valeur: '2024-01-01',
            objectif: 31280,
          },
          {
            id: 14867,
            date_valeur: '2025-01-01',
            objectif: 30780,
          },
          {
            id: 14868,
            date_valeur: '2026-01-01',
            objectif: 30400,
          },
          {
            id: 14869,
            date_valeur: '2027-01-01',
            objectif: 30020,
          },
          {
            id: 14870,
            date_valeur: '2028-01-01',
            objectif: 29640,
          },
          {
            id: 14871,
            date_valeur: '2029-01-01',
            objectif: 29260,
          },
          {
            id: 14872,
            date_valeur: '2030-01-01',
            objectif: 28880,
          },
          {
            id: 14873,
            date_valeur: '2031-01-01',
            objectif: 28290,
          },
          {
            id: 14874,
            date_valeur: '2032-01-01',
            objectif: 27710,
          },
          {
            id: 14875,
            date_valeur: '2033-01-01',
            objectif: 27120,
          },
          {
            id: 14876,
            date_valeur: '2034-01-01',
            objectif: 26530,
          },
          {
            id: 14877,
            date_valeur: '2035-01-01',
            objectif: 25940,
          },
          {
            id: 14878,
            date_valeur: '2036-01-01',
            objectif: 25350,
          },
          {
            id: 14879,
            date_valeur: '2037-01-01',
            objectif: 24760,
          },
          {
            id: 14880,
            date_valeur: '2038-01-01',
            objectif: 24170,
          },
          {
            id: 14881,
            date_valeur: '2039-01-01',
            objectif: 23580,
          },
          {
            id: 14882,
            date_valeur: '2040-01-01',
            objectif: 22990,
          },
          {
            id: 14883,
            date_valeur: '2041-01-01',
            objectif: 22400,
          },
          {
            id: 14884,
            date_valeur: '2042-01-01',
            objectif: 21800,
          },
          {
            id: 14885,
            date_valeur: '2043-01-01',
            objectif: 21210,
          },
          {
            id: 14886,
            date_valeur: '2044-01-01',
            objectif: 20610,
          },
          {
            id: 14887,
            date_valeur: '2045-01-01',
            objectif: 20020,
          },
          {
            id: 14888,
            date_valeur: '2046-01-01',
            objectif: 19460,
          },
          {
            id: 14889,
            date_valeur: '2047-01-01',
            objectif: 18900,
          },
          {
            id: 14890,
            date_valeur: '2048-01-01',
            objectif: 18350,
          },
          {
            id: 14891,
            date_valeur: '2049-01-01',
            objectif: 17790,
          },
          {
            id: 14892,
            date_valeur: '2050-01-01',
            objectif: 17240,
          },
        ],
      },
      {
        definition: {
          id: 17,
          identifiant_referentiel: 'cae_1.ga',
          titre: 'Emissions de gaz à effet de serre - agriculture - Energie',
          titre_long:
            'Emissions de gaz à effet de serre secteur Agriculture - Energie',
          description: '',
          unite: 'teq CO2',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 14353,
            date_valeur: '2015-01-01',
            objectif: 5400,
          },
          {
            id: 14354,
            date_valeur: '2016-01-01',
            objectif: 5200,
          },
          {
            id: 14355,
            date_valeur: '2017-01-01',
            objectif: 5100,
          },
          {
            id: 14356,
            date_valeur: '2018-01-01',
            objectif: 5000,
          },
          {
            id: 14357,
            date_valeur: '2019-01-01',
            objectif: 4900,
          },
          {
            id: 14358,
            date_valeur: '2020-01-01',
            objectif: 4700,
          },
          {
            id: 14359,
            date_valeur: '2021-01-01',
            objectif: 4600,
          },
          {
            id: 14360,
            date_valeur: '2022-01-01',
            objectif: 4500,
          },
          {
            id: 14361,
            date_valeur: '2023-01-01',
            objectif: 4400,
          },
          {
            id: 14362,
            date_valeur: '2024-01-01',
            objectif: 4300,
          },
          {
            id: 14363,
            date_valeur: '2025-01-01',
            objectif: 4200,
          },
          {
            id: 14364,
            date_valeur: '2026-01-01',
            objectif: 4100,
          },
          {
            id: 14365,
            date_valeur: '2027-01-01',
            objectif: 4000,
          },
          {
            id: 14366,
            date_valeur: '2028-01-01',
            objectif: 3900,
          },
          {
            id: 14367,
            date_valeur: '2029-01-01',
            objectif: 3900,
          },
          {
            id: 14368,
            date_valeur: '2030-01-01',
            objectif: 3800,
          },
          {
            id: 14369,
            date_valeur: '2031-01-01',
            objectif: 3600,
          },
          {
            id: 14370,
            date_valeur: '2032-01-01',
            objectif: 3500,
          },
          {
            id: 14371,
            date_valeur: '2033-01-01',
            objectif: 3300,
          },
          {
            id: 14372,
            date_valeur: '2034-01-01',
            objectif: 3200,
          },
          {
            id: 14373,
            date_valeur: '2035-01-01',
            objectif: 3000,
          },
          {
            id: 14374,
            date_valeur: '2036-01-01',
            objectif: 2900,
          },
          {
            id: 14375,
            date_valeur: '2037-01-01',
            objectif: 2700,
          },
          {
            id: 14376,
            date_valeur: '2038-01-01',
            objectif: 2500,
          },
          {
            id: 14377,
            date_valeur: '2039-01-01',
            objectif: 2400,
          },
          {
            id: 14378,
            date_valeur: '2040-01-01',
            objectif: 2200,
          },
          {
            id: 14379,
            date_valeur: '2041-01-01',
            objectif: 2100,
          },
          {
            id: 14380,
            date_valeur: '2042-01-01',
            objectif: 2000,
          },
          {
            id: 14381,
            date_valeur: '2043-01-01',
            objectif: 1800,
          },
          {
            id: 14382,
            date_valeur: '2044-01-01',
            objectif: 1700,
          },
          {
            id: 14383,
            date_valeur: '2045-01-01',
            objectif: 1600,
          },
          {
            id: 14384,
            date_valeur: '2046-01-01',
            objectif: 1400,
          },
          {
            id: 14385,
            date_valeur: '2047-01-01',
            objectif: 1200,
          },
          {
            id: 14386,
            date_valeur: '2048-01-01',
            objectif: 1000,
          },
          {
            id: 14387,
            date_valeur: '2049-01-01',
            objectif: 800,
          },
          {
            id: 14388,
            date_valeur: '2050-01-01',
            objectif: 600,
          },
        ],
      },
      {
        definition: {
          id: 18,
          identifiant_referentiel: 'cae_1.gb',
          titre: 'Emissions de gaz à effet de serre - agriculture - Elevage',
          titre_long:
            'Emissions de gaz à effet de serre secteur Agriculture - Elevage',
          description: '',
          unite: 'teq CO2',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 14389,
            date_valeur: '2015-01-01',
            objectif: 5400,
          },
          {
            id: 14390,
            date_valeur: '2016-01-01',
            objectif: 5300,
          },
          {
            id: 14391,
            date_valeur: '2017-01-01',
            objectif: 5300,
          },
          {
            id: 14392,
            date_valeur: '2018-01-01',
            objectif: 5200,
          },
          {
            id: 14393,
            date_valeur: '2019-01-01',
            objectif: 5100,
          },
          {
            id: 14394,
            date_valeur: '2020-01-01',
            objectif: 5100,
          },
          {
            id: 14395,
            date_valeur: '2021-01-01',
            objectif: 5000,
          },
          {
            id: 14396,
            date_valeur: '2022-01-01',
            objectif: 4900,
          },
          {
            id: 14397,
            date_valeur: '2023-01-01',
            objectif: 4900,
          },
          {
            id: 14398,
            date_valeur: '2024-01-01',
            objectif: 4800,
          },
          {
            id: 14399,
            date_valeur: '2025-01-01',
            objectif: 4700,
          },
          {
            id: 14400,
            date_valeur: '2026-01-01',
            objectif: 4700,
          },
          {
            id: 14401,
            date_valeur: '2027-01-01',
            objectif: 4600,
          },
          {
            id: 14402,
            date_valeur: '2028-01-01',
            objectif: 4600,
          },
          {
            id: 14403,
            date_valeur: '2029-01-01',
            objectif: 4500,
          },
          {
            id: 14404,
            date_valeur: '2030-01-01',
            objectif: 4500,
          },
          {
            id: 14405,
            date_valeur: '2031-01-01',
            objectif: 4400,
          },
          {
            id: 14406,
            date_valeur: '2032-01-01',
            objectif: 4400,
          },
          {
            id: 14407,
            date_valeur: '2033-01-01',
            objectif: 4300,
          },
          {
            id: 14408,
            date_valeur: '2034-01-01',
            objectif: 4300,
          },
          {
            id: 14409,
            date_valeur: '2035-01-01',
            objectif: 4200,
          },
          {
            id: 14410,
            date_valeur: '2036-01-01',
            objectif: 4200,
          },
          {
            id: 14411,
            date_valeur: '2037-01-01',
            objectif: 4100,
          },
          {
            id: 14412,
            date_valeur: '2038-01-01',
            objectif: 4100,
          },
          {
            id: 14413,
            date_valeur: '2039-01-01',
            objectif: 4100,
          },
          {
            id: 14414,
            date_valeur: '2040-01-01',
            objectif: 4000,
          },
          {
            id: 14415,
            date_valeur: '2041-01-01',
            objectif: 4000,
          },
          {
            id: 14416,
            date_valeur: '2042-01-01',
            objectif: 3900,
          },
          {
            id: 14417,
            date_valeur: '2043-01-01',
            objectif: 3900,
          },
          {
            id: 14418,
            date_valeur: '2044-01-01',
            objectif: 3800,
          },
          {
            id: 14419,
            date_valeur: '2045-01-01',
            objectif: 3800,
          },
          {
            id: 14420,
            date_valeur: '2046-01-01',
            objectif: 3700,
          },
          {
            id: 14421,
            date_valeur: '2047-01-01',
            objectif: 3700,
          },
          {
            id: 14422,
            date_valeur: '2048-01-01',
            objectif: 3600,
          },
          {
            id: 14423,
            date_valeur: '2049-01-01',
            objectif: 3600,
          },
          {
            id: 14424,
            date_valeur: '2050-01-01',
            objectif: 3600,
          },
        ],
      },
      {
        definition: {
          id: 19,
          identifiant_referentiel: 'cae_1.gc',
          titre:
            'Emissions de gaz à effet de serre - agriculture - Pratiques culturales',
          titre_long:
            'Emissions de gaz à effet de serre secteur Agriculture - Pratiques culturales',
          description: '',
          unite: 'teq CO2',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 14425,
            date_valeur: '2015-01-01',
            objectif: 24500,
          },
          {
            id: 14426,
            date_valeur: '2016-01-01',
            objectif: 24300,
          },
          {
            id: 14427,
            date_valeur: '2017-01-01',
            objectif: 24100,
          },
          {
            id: 14428,
            date_valeur: '2018-01-01',
            objectif: 23900,
          },
          {
            id: 14429,
            date_valeur: '2019-01-01',
            objectif: 23700,
          },
          {
            id: 14430,
            date_valeur: '2020-01-01',
            objectif: 23500,
          },
          {
            id: 14431,
            date_valeur: '2021-01-01',
            objectif: 23100,
          },
          {
            id: 14432,
            date_valeur: '2022-01-01',
            objectif: 22800,
          },
          {
            id: 14433,
            date_valeur: '2023-01-01',
            objectif: 22500,
          },
          {
            id: 14434,
            date_valeur: '2024-01-01',
            objectif: 22200,
          },
          {
            id: 14435,
            date_valeur: '2025-01-01',
            objectif: 21800,
          },
          {
            id: 14436,
            date_valeur: '2026-01-01',
            objectif: 21600,
          },
          {
            id: 14437,
            date_valeur: '2027-01-01',
            objectif: 21400,
          },
          {
            id: 14438,
            date_valeur: '2028-01-01',
            objectif: 21100,
          },
          {
            id: 14439,
            date_valeur: '2029-01-01',
            objectif: 20900,
          },
          {
            id: 14440,
            date_valeur: '2030-01-01',
            objectif: 20600,
          },
          {
            id: 14441,
            date_valeur: '2031-01-01',
            objectif: 20300,
          },
          {
            id: 14442,
            date_valeur: '2032-01-01',
            objectif: 19900,
          },
          {
            id: 14443,
            date_valeur: '2033-01-01',
            objectif: 19500,
          },
          {
            id: 14444,
            date_valeur: '2034-01-01',
            objectif: 19100,
          },
          {
            id: 14445,
            date_valeur: '2035-01-01',
            objectif: 18700,
          },
          {
            id: 14446,
            date_valeur: '2036-01-01',
            objectif: 18300,
          },
          {
            id: 14447,
            date_valeur: '2037-01-01',
            objectif: 17900,
          },
          {
            id: 14448,
            date_valeur: '2038-01-01',
            objectif: 17500,
          },
          {
            id: 14449,
            date_valeur: '2039-01-01',
            objectif: 17100,
          },
          {
            id: 14450,
            date_valeur: '2040-01-01',
            objectif: 16800,
          },
          {
            id: 14451,
            date_valeur: '2041-01-01',
            objectif: 16300,
          },
          {
            id: 14452,
            date_valeur: '2042-01-01',
            objectif: 15900,
          },
          {
            id: 14453,
            date_valeur: '2043-01-01',
            objectif: 15500,
          },
          {
            id: 14454,
            date_valeur: '2044-01-01',
            objectif: 15100,
          },
          {
            id: 14455,
            date_valeur: '2045-01-01',
            objectif: 14600,
          },
          {
            id: 14456,
            date_valeur: '2046-01-01',
            objectif: 14300,
          },
          {
            id: 14457,
            date_valeur: '2047-01-01',
            objectif: 14000,
          },
          {
            id: 14458,
            date_valeur: '2048-01-01',
            objectif: 13700,
          },
          {
            id: 14459,
            date_valeur: '2049-01-01',
            objectif: 13400,
          },
          {
            id: 14460,
            date_valeur: '2050-01-01',
            objectif: 13100,
          },
        ],
      },
      {
        definition: {
          id: 20,
          identifiant_referentiel: 'cae_1.h',
          titre: 'Emissions de gaz à effet de serre - déchets',
          titre_long:
            'Emissions de gaz à effet de serre du secteur des déchets',
          description: '',
          unite: 'teq CO2',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 14929,
            date_valeur: '2015-01-01',
            objectif: 39790,
          },
          {
            id: 14930,
            date_valeur: '2016-01-01',
            objectif: 38210,
          },
          {
            id: 14931,
            date_valeur: '2017-01-01',
            objectif: 36900,
          },
          {
            id: 14932,
            date_valeur: '2018-01-01',
            objectif: 35580,
          },
          {
            id: 14933,
            date_valeur: '2019-01-01',
            objectif: 34340,
          },
          {
            id: 14934,
            date_valeur: '2020-01-01',
            objectif: 33070,
          },
          {
            id: 14935,
            date_valeur: '2021-01-01',
            objectif: 32180,
          },
          {
            id: 14936,
            date_valeur: '2022-01-01',
            objectif: 31280,
          },
          {
            id: 14937,
            date_valeur: '2023-01-01',
            objectif: 30370,
          },
          {
            id: 14938,
            date_valeur: '2024-01-01',
            objectif: 29460,
          },
          {
            id: 14939,
            date_valeur: '2025-01-01',
            objectif: 28550,
          },
          {
            id: 14940,
            date_valeur: '2026-01-01',
            objectif: 27930,
          },
          {
            id: 14941,
            date_valeur: '2027-01-01',
            objectif: 27330,
          },
          {
            id: 14942,
            date_valeur: '2028-01-01',
            objectif: 26710,
          },
          {
            id: 14943,
            date_valeur: '2029-01-01',
            objectif: 26110,
          },
          {
            id: 14944,
            date_valeur: '2030-01-01',
            objectif: 25500,
          },
          {
            id: 14945,
            date_valeur: '2031-01-01',
            objectif: 24930,
          },
          {
            id: 14946,
            date_valeur: '2032-01-01',
            objectif: 24370,
          },
          {
            id: 14947,
            date_valeur: '2033-01-01',
            objectif: 23790,
          },
          {
            id: 14948,
            date_valeur: '2034-01-01',
            objectif: 23230,
          },
          {
            id: 14949,
            date_valeur: '2035-01-01',
            objectif: 22650,
          },
          {
            id: 14950,
            date_valeur: '2036-01-01',
            objectif: 22070,
          },
          {
            id: 14951,
            date_valeur: '2037-01-01',
            objectif: 21480,
          },
          {
            id: 14952,
            date_valeur: '2038-01-01',
            objectif: 20910,
          },
          {
            id: 14953,
            date_valeur: '2039-01-01',
            objectif: 20330,
          },
          {
            id: 14954,
            date_valeur: '2040-01-01',
            objectif: 19740,
          },
          {
            id: 14955,
            date_valeur: '2041-01-01',
            objectif: 19150,
          },
          {
            id: 14956,
            date_valeur: '2042-01-01',
            objectif: 18570,
          },
          {
            id: 14957,
            date_valeur: '2043-01-01',
            objectif: 17980,
          },
          {
            id: 14958,
            date_valeur: '2044-01-01',
            objectif: 17390,
          },
          {
            id: 14959,
            date_valeur: '2045-01-01',
            objectif: 16800,
          },
          {
            id: 14960,
            date_valeur: '2046-01-01',
            objectif: 16220,
          },
          {
            id: 14961,
            date_valeur: '2047-01-01',
            objectif: 15620,
          },
          {
            id: 14962,
            date_valeur: '2048-01-01',
            objectif: 15030,
          },
          {
            id: 14963,
            date_valeur: '2049-01-01',
            objectif: 14430,
          },
          {
            id: 14964,
            date_valeur: '2050-01-01',
            objectif: 13840,
          },
        ],
      },
      {
        definition: {
          id: 21,
          identifiant_referentiel: 'cae_1.i',
          titre:
            'Emissions de gaz à effet de serre - industrie hors branche énergie',
          titre_long:
            "Emissions de gaz à effet de serre du secteur de l'industrie hors branche énergie",
          description: '',
          unite: 'teq CO2',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 14821,
            date_valeur: '2015-01-01',
            objectif: 348530,
          },
          {
            id: 14822,
            date_valeur: '2016-01-01',
            objectif: 345350,
          },
          {
            id: 14823,
            date_valeur: '2017-01-01',
            objectif: 342380,
          },
          {
            id: 14824,
            date_valeur: '2018-01-01',
            objectif: 334960,
          },
          {
            id: 14825,
            date_valeur: '2019-01-01',
            objectif: 327540,
          },
          {
            id: 14826,
            date_valeur: '2020-01-01',
            objectif: 320110,
          },
          {
            id: 14827,
            date_valeur: '2021-01-01',
            objectif: 310780,
          },
          {
            id: 14828,
            date_valeur: '2022-01-01',
            objectif: 301460,
          },
          {
            id: 14829,
            date_valeur: '2023-01-01',
            objectif: 292170,
          },
          {
            id: 14830,
            date_valeur: '2024-01-01',
            objectif: 282900,
          },
          {
            id: 14831,
            date_valeur: '2025-01-01',
            objectif: 273650,
          },
          {
            id: 14832,
            date_valeur: '2026-01-01',
            objectif: 263300,
          },
          {
            id: 14833,
            date_valeur: '2027-01-01',
            objectif: 252960,
          },
          {
            id: 14834,
            date_valeur: '2028-01-01',
            objectif: 242630,
          },
          {
            id: 14835,
            date_valeur: '2029-01-01',
            objectif: 232300,
          },
          {
            id: 14836,
            date_valeur: '2030-01-01',
            objectif: 221980,
          },
          {
            id: 14837,
            date_valeur: '2031-01-01',
            objectif: 213270,
          },
          {
            id: 14838,
            date_valeur: '2032-01-01',
            objectif: 204540,
          },
          {
            id: 14839,
            date_valeur: '2033-01-01',
            objectif: 195810,
          },
          {
            id: 14840,
            date_valeur: '2034-01-01',
            objectif: 187050,
          },
          {
            id: 14841,
            date_valeur: '2035-01-01',
            objectif: 178280,
          },
          {
            id: 14842,
            date_valeur: '2036-01-01',
            objectif: 169500,
          },
          {
            id: 14843,
            date_valeur: '2037-01-01',
            objectif: 160710,
          },
          {
            id: 14844,
            date_valeur: '2038-01-01',
            objectif: 151890,
          },
          {
            id: 14845,
            date_valeur: '2039-01-01',
            objectif: 143070,
          },
          {
            id: 14846,
            date_valeur: '2040-01-01',
            objectif: 134230,
          },
          {
            id: 14847,
            date_valeur: '2041-01-01',
            objectif: 125380,
          },
          {
            id: 14848,
            date_valeur: '2042-01-01',
            objectif: 116510,
          },
          {
            id: 14849,
            date_valeur: '2043-01-01',
            objectif: 107630,
          },
          {
            id: 14850,
            date_valeur: '2044-01-01',
            objectif: 98740,
          },
          {
            id: 14851,
            date_valeur: '2045-01-01',
            objectif: 89830,
          },
          {
            id: 14852,
            date_valeur: '2046-01-01',
            objectif: 80910,
          },
          {
            id: 14853,
            date_valeur: '2047-01-01',
            objectif: 71980,
          },
          {
            id: 14854,
            date_valeur: '2048-01-01',
            objectif: 63030,
          },
          {
            id: 14855,
            date_valeur: '2049-01-01',
            objectif: 54070,
          },
          {
            id: 14856,
            date_valeur: '2050-01-01',
            objectif: 45100,
          },
        ],
      },
      {
        definition: {
          id: 22,
          identifiant_referentiel: 'cae_1.ia',
          titre:
            'Emissions de gaz à effet de serre - industrie - Métaux primaires',
          titre_long:
            'Emissions de gaz à effet de serre secteur Industrie - Métaux primaires',
          description: '',
          unite: 'teq CO2',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 14101,
            date_valeur: '2015-01-01',
            objectif: 2700,
          },
          {
            id: 14102,
            date_valeur: '2016-01-01',
            objectif: 2600,
          },
          {
            id: 14103,
            date_valeur: '2017-01-01',
            objectif: 2600,
          },
          {
            id: 14104,
            date_valeur: '2018-01-01',
            objectif: 2500,
          },
          {
            id: 14105,
            date_valeur: '2019-01-01',
            objectif: 2500,
          },
          {
            id: 14106,
            date_valeur: '2020-01-01',
            objectif: 2400,
          },
          {
            id: 14107,
            date_valeur: '2021-01-01',
            objectif: 2400,
          },
          {
            id: 14108,
            date_valeur: '2022-01-01',
            objectif: 2300,
          },
          {
            id: 14109,
            date_valeur: '2023-01-01',
            objectif: 2300,
          },
          {
            id: 14110,
            date_valeur: '2024-01-01',
            objectif: 2200,
          },
          {
            id: 14111,
            date_valeur: '2025-01-01',
            objectif: 2200,
          },
          {
            id: 14112,
            date_valeur: '2026-01-01',
            objectif: 2100,
          },
          {
            id: 14113,
            date_valeur: '2027-01-01',
            objectif: 2100,
          },
          {
            id: 14114,
            date_valeur: '2028-01-01',
            objectif: 2000,
          },
          {
            id: 14115,
            date_valeur: '2029-01-01',
            objectif: 2000,
          },
          {
            id: 14116,
            date_valeur: '2030-01-01',
            objectif: 1900,
          },
          {
            id: 14117,
            date_valeur: '2031-01-01',
            objectif: 1800,
          },
          {
            id: 14118,
            date_valeur: '2032-01-01',
            objectif: 1800,
          },
          {
            id: 14119,
            date_valeur: '2033-01-01',
            objectif: 1700,
          },
          {
            id: 14120,
            date_valeur: '2034-01-01',
            objectif: 1700,
          },
          {
            id: 14121,
            date_valeur: '2035-01-01',
            objectif: 1600,
          },
          {
            id: 14122,
            date_valeur: '2036-01-01',
            objectif: 1600,
          },
          {
            id: 14123,
            date_valeur: '2037-01-01',
            objectif: 1500,
          },
          {
            id: 14124,
            date_valeur: '2038-01-01',
            objectif: 1500,
          },
          {
            id: 14125,
            date_valeur: '2039-01-01',
            objectif: 1400,
          },
          {
            id: 14126,
            date_valeur: '2040-01-01',
            objectif: 1400,
          },
          {
            id: 14127,
            date_valeur: '2041-01-01',
            objectif: 1300,
          },
          {
            id: 14128,
            date_valeur: '2042-01-01',
            objectif: 1200,
          },
          {
            id: 14129,
            date_valeur: '2043-01-01',
            objectif: 1200,
          },
          {
            id: 14130,
            date_valeur: '2044-01-01',
            objectif: 1100,
          },
          {
            id: 14131,
            date_valeur: '2045-01-01',
            objectif: 1100,
          },
          {
            id: 14132,
            date_valeur: '2046-01-01',
            objectif: 1000,
          },
          {
            id: 14133,
            date_valeur: '2047-01-01',
            objectif: 1000,
          },
          {
            id: 14134,
            date_valeur: '2048-01-01',
            objectif: 900,
          },
          {
            id: 14135,
            date_valeur: '2049-01-01',
            objectif: 900,
          },
          {
            id: 14136,
            date_valeur: '2050-01-01',
            objectif: 800,
          },
        ],
      },
      {
        definition: {
          id: 23,
          identifiant_referentiel: 'cae_1.ib',
          titre: 'Emissions de gaz à effet de serre - industrie - Chimie',
          titre_long:
            'Emissions de gaz à effet de serre secteur Industrie - Chimie',
          description: '',
          unite: 'teq CO2',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 14137,
            date_valeur: '2015-01-01',
            objectif: 160900,
          },
          {
            id: 14138,
            date_valeur: '2016-01-01',
            objectif: 157500,
          },
          {
            id: 14139,
            date_valeur: '2017-01-01',
            objectif: 154100,
          },
          {
            id: 14140,
            date_valeur: '2018-01-01',
            objectif: 150700,
          },
          {
            id: 14141,
            date_valeur: '2019-01-01',
            objectif: 147400,
          },
          {
            id: 14142,
            date_valeur: '2020-01-01',
            objectif: 144000,
          },
          {
            id: 14143,
            date_valeur: '2021-01-01',
            objectif: 140600,
          },
          {
            id: 14144,
            date_valeur: '2022-01-01',
            objectif: 137200,
          },
          {
            id: 14145,
            date_valeur: '2023-01-01',
            objectif: 133800,
          },
          {
            id: 14146,
            date_valeur: '2024-01-01',
            objectif: 130500,
          },
          {
            id: 14147,
            date_valeur: '2025-01-01',
            objectif: 127100,
          },
          {
            id: 14148,
            date_valeur: '2026-01-01',
            objectif: 123700,
          },
          {
            id: 14149,
            date_valeur: '2027-01-01',
            objectif: 120300,
          },
          {
            id: 14150,
            date_valeur: '2028-01-01',
            objectif: 117000,
          },
          {
            id: 14151,
            date_valeur: '2029-01-01',
            objectif: 113600,
          },
          {
            id: 14152,
            date_valeur: '2030-01-01',
            objectif: 110200,
          },
          {
            id: 14153,
            date_valeur: '2031-01-01',
            objectif: 105800,
          },
          {
            id: 14154,
            date_valeur: '2032-01-01',
            objectif: 101400,
          },
          {
            id: 14155,
            date_valeur: '2033-01-01',
            objectif: 97000,
          },
          {
            id: 14156,
            date_valeur: '2034-01-01',
            objectif: 92500,
          },
          {
            id: 14157,
            date_valeur: '2035-01-01',
            objectif: 88100,
          },
          {
            id: 14158,
            date_valeur: '2036-01-01',
            objectif: 83700,
          },
          {
            id: 14159,
            date_valeur: '2037-01-01',
            objectif: 79300,
          },
          {
            id: 14160,
            date_valeur: '2038-01-01',
            objectif: 74900,
          },
          {
            id: 14161,
            date_valeur: '2039-01-01',
            objectif: 70500,
          },
          {
            id: 14162,
            date_valeur: '2040-01-01',
            objectif: 66000,
          },
          {
            id: 14163,
            date_valeur: '2041-01-01',
            objectif: 61600,
          },
          {
            id: 14164,
            date_valeur: '2042-01-01',
            objectif: 57200,
          },
          {
            id: 14165,
            date_valeur: '2043-01-01',
            objectif: 52800,
          },
          {
            id: 14166,
            date_valeur: '2044-01-01',
            objectif: 48400,
          },
          {
            id: 14167,
            date_valeur: '2045-01-01',
            objectif: 44000,
          },
          {
            id: 14168,
            date_valeur: '2046-01-01',
            objectif: 39500,
          },
          {
            id: 14169,
            date_valeur: '2047-01-01',
            objectif: 35100,
          },
          {
            id: 14170,
            date_valeur: '2048-01-01',
            objectif: 30700,
          },
          {
            id: 14171,
            date_valeur: '2049-01-01',
            objectif: 26300,
          },
          {
            id: 14172,
            date_valeur: '2050-01-01',
            objectif: 21900,
          },
        ],
      },
      {
        definition: {
          id: 24,
          identifiant_referentiel: 'cae_1.ic',
          titre:
            'Emissions de gaz à effet de serre - industrie - Non-métalliques',
          titre_long:
            'Emissions de gaz à effet de serre secteur Industrie - Non-métalliques',
          description: '',
          unite: 'teq CO2',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 14173,
            date_valeur: '2015-01-01',
            objectif: 30300,
          },
          {
            id: 14174,
            date_valeur: '2016-01-01',
            objectif: 29900,
          },
          {
            id: 14175,
            date_valeur: '2017-01-01',
            objectif: 29600,
          },
          {
            id: 14176,
            date_valeur: '2018-01-01',
            objectif: 29300,
          },
          {
            id: 14177,
            date_valeur: '2019-01-01',
            objectif: 28900,
          },
          {
            id: 14178,
            date_valeur: '2020-01-01',
            objectif: 28600,
          },
          {
            id: 14179,
            date_valeur: '2021-01-01',
            objectif: 28300,
          },
          {
            id: 14180,
            date_valeur: '2022-01-01',
            objectif: 27900,
          },
          {
            id: 14181,
            date_valeur: '2023-01-01',
            objectif: 27600,
          },
          {
            id: 14182,
            date_valeur: '2024-01-01',
            objectif: 27300,
          },
          {
            id: 14183,
            date_valeur: '2025-01-01',
            objectif: 26900,
          },
          {
            id: 14184,
            date_valeur: '2026-01-01',
            objectif: 26600,
          },
          {
            id: 14185,
            date_valeur: '2027-01-01',
            objectif: 26300,
          },
          {
            id: 14186,
            date_valeur: '2028-01-01',
            objectif: 25900,
          },
          {
            id: 14187,
            date_valeur: '2029-01-01',
            objectif: 25600,
          },
          {
            id: 14188,
            date_valeur: '2030-01-01',
            objectif: 25300,
          },
          {
            id: 14189,
            date_valeur: '2031-01-01',
            objectif: 24500,
          },
          {
            id: 14190,
            date_valeur: '2032-01-01',
            objectif: 23800,
          },
          {
            id: 14191,
            date_valeur: '2033-01-01',
            objectif: 23000,
          },
          {
            id: 14192,
            date_valeur: '2034-01-01',
            objectif: 22300,
          },
          {
            id: 14193,
            date_valeur: '2035-01-01',
            objectif: 21500,
          },
          {
            id: 14194,
            date_valeur: '2036-01-01',
            objectif: 20800,
          },
          {
            id: 14195,
            date_valeur: '2037-01-01',
            objectif: 20000,
          },
          {
            id: 14196,
            date_valeur: '2038-01-01',
            objectif: 19300,
          },
          {
            id: 14197,
            date_valeur: '2039-01-01',
            objectif: 18500,
          },
          {
            id: 14198,
            date_valeur: '2040-01-01',
            objectif: 17800,
          },
          {
            id: 14199,
            date_valeur: '2041-01-01',
            objectif: 17000,
          },
          {
            id: 14200,
            date_valeur: '2042-01-01',
            objectif: 16300,
          },
          {
            id: 14201,
            date_valeur: '2043-01-01',
            objectif: 15500,
          },
          {
            id: 14202,
            date_valeur: '2044-01-01',
            objectif: 14800,
          },
          {
            id: 14203,
            date_valeur: '2045-01-01',
            objectif: 14000,
          },
          {
            id: 14204,
            date_valeur: '2046-01-01',
            objectif: 13300,
          },
          {
            id: 14205,
            date_valeur: '2047-01-01',
            objectif: 12500,
          },
          {
            id: 14206,
            date_valeur: '2048-01-01',
            objectif: 11800,
          },
          {
            id: 14207,
            date_valeur: '2049-01-01',
            objectif: 11000,
          },
          {
            id: 14208,
            date_valeur: '2050-01-01',
            objectif: 10300,
          },
        ],
      },
      {
        definition: {
          id: 25,
          identifiant_referentiel: 'cae_1.id',
          titre:
            'Emissions de gaz à effet de serre - industrie - Agro-industries',
          titre_long:
            'Emissions de gaz à effet de serre secteur Industrie - Agro-industries',
          description: '',
          unite: 'teq CO2',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 14209,
            date_valeur: '2015-01-01',
            objectif: 53100,
          },
          {
            id: 14210,
            date_valeur: '2016-01-01',
            objectif: 52400,
          },
          {
            id: 14211,
            date_valeur: '2017-01-01',
            objectif: 51600,
          },
          {
            id: 14212,
            date_valeur: '2018-01-01',
            objectif: 50800,
          },
          {
            id: 14213,
            date_valeur: '2019-01-01',
            objectif: 50100,
          },
          {
            id: 14214,
            date_valeur: '2020-01-01',
            objectif: 49300,
          },
          {
            id: 14215,
            date_valeur: '2021-01-01',
            objectif: 48600,
          },
          {
            id: 14216,
            date_valeur: '2022-01-01',
            objectif: 47800,
          },
          {
            id: 14217,
            date_valeur: '2023-01-01',
            objectif: 47000,
          },
          {
            id: 14218,
            date_valeur: '2024-01-01',
            objectif: 46300,
          },
          {
            id: 14219,
            date_valeur: '2025-01-01',
            objectif: 45500,
          },
          {
            id: 14220,
            date_valeur: '2026-01-01',
            objectif: 44800,
          },
          {
            id: 14221,
            date_valeur: '2027-01-01',
            objectif: 44000,
          },
          {
            id: 14222,
            date_valeur: '2028-01-01',
            objectif: 43200,
          },
          {
            id: 14223,
            date_valeur: '2029-01-01',
            objectif: 42500,
          },
          {
            id: 14224,
            date_valeur: '2030-01-01',
            objectif: 41700,
          },
          {
            id: 14225,
            date_valeur: '2031-01-01',
            objectif: 39900,
          },
          {
            id: 14226,
            date_valeur: '2032-01-01',
            objectif: 38000,
          },
          {
            id: 14227,
            date_valeur: '2033-01-01',
            objectif: 36200,
          },
          {
            id: 14228,
            date_valeur: '2034-01-01',
            objectif: 34400,
          },
          {
            id: 14229,
            date_valeur: '2035-01-01',
            objectif: 32500,
          },
          {
            id: 14230,
            date_valeur: '2036-01-01',
            objectif: 30700,
          },
          {
            id: 14231,
            date_valeur: '2037-01-01',
            objectif: 28900,
          },
          {
            id: 14232,
            date_valeur: '2038-01-01',
            objectif: 27000,
          },
          {
            id: 14233,
            date_valeur: '2039-01-01',
            objectif: 25200,
          },
          {
            id: 14234,
            date_valeur: '2040-01-01',
            objectif: 23300,
          },
          {
            id: 14235,
            date_valeur: '2041-01-01',
            objectif: 21500,
          },
          {
            id: 14236,
            date_valeur: '2042-01-01',
            objectif: 19700,
          },
          {
            id: 14237,
            date_valeur: '2043-01-01',
            objectif: 17800,
          },
          {
            id: 14238,
            date_valeur: '2044-01-01',
            objectif: 16000,
          },
          {
            id: 14239,
            date_valeur: '2045-01-01',
            objectif: 14200,
          },
          {
            id: 14240,
            date_valeur: '2046-01-01',
            objectif: 12300,
          },
          {
            id: 14241,
            date_valeur: '2047-01-01',
            objectif: 10500,
          },
          {
            id: 14242,
            date_valeur: '2048-01-01',
            objectif: 8700,
          },
          {
            id: 14243,
            date_valeur: '2049-01-01',
            objectif: 6800,
          },
          {
            id: 14244,
            date_valeur: '2050-01-01',
            objectif: 5000,
          },
        ],
      },
      {
        definition: {
          id: 26,
          identifiant_referentiel: 'cae_1.ie',
          titre: 'Emissions de gaz à effet de serre - industrie - Equipements',
          titre_long:
            'Emissions de gaz à effet de serre secteur Industrie - Equipements',
          description: '',
          unite: 'teq CO2',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 14245,
            date_valeur: '2015-01-01',
            objectif: 81700,
          },
          {
            id: 14246,
            date_valeur: '2016-01-01',
            objectif: 78300,
          },
          {
            id: 14247,
            date_valeur: '2017-01-01',
            objectif: 74900,
          },
          {
            id: 14248,
            date_valeur: '2018-01-01',
            objectif: 71500,
          },
          {
            id: 14249,
            date_valeur: '2019-01-01',
            objectif: 68100,
          },
          {
            id: 14250,
            date_valeur: '2020-01-01',
            objectif: 64700,
          },
          {
            id: 14251,
            date_valeur: '2021-01-01',
            objectif: 61400,
          },
          {
            id: 14252,
            date_valeur: '2022-01-01',
            objectif: 58000,
          },
          {
            id: 14253,
            date_valeur: '2023-01-01',
            objectif: 54600,
          },
          {
            id: 14254,
            date_valeur: '2024-01-01',
            objectif: 51200,
          },
          {
            id: 14255,
            date_valeur: '2025-01-01',
            objectif: 47800,
          },
          {
            id: 14256,
            date_valeur: '2026-01-01',
            objectif: 44500,
          },
          {
            id: 14257,
            date_valeur: '2027-01-01',
            objectif: 41100,
          },
          {
            id: 14258,
            date_valeur: '2028-01-01',
            objectif: 37700,
          },
          {
            id: 14259,
            date_valeur: '2029-01-01',
            objectif: 34300,
          },
          {
            id: 14260,
            date_valeur: '2030-01-01',
            objectif: 30900,
          },
          {
            id: 14261,
            date_valeur: '2031-01-01',
            objectif: 29700,
          },
          {
            id: 14262,
            date_valeur: '2032-01-01',
            objectif: 28500,
          },
          {
            id: 14263,
            date_valeur: '2033-01-01',
            objectif: 27400,
          },
          {
            id: 14264,
            date_valeur: '2034-01-01',
            objectif: 26200,
          },
          {
            id: 14265,
            date_valeur: '2035-01-01',
            objectif: 25000,
          },
          {
            id: 14266,
            date_valeur: '2036-01-01',
            objectif: 23800,
          },
          {
            id: 14267,
            date_valeur: '2037-01-01',
            objectif: 22600,
          },
          {
            id: 14268,
            date_valeur: '2038-01-01',
            objectif: 21400,
          },
          {
            id: 14269,
            date_valeur: '2039-01-01',
            objectif: 20200,
          },
          {
            id: 14270,
            date_valeur: '2040-01-01',
            objectif: 19000,
          },
          {
            id: 14271,
            date_valeur: '2041-01-01',
            objectif: 17800,
          },
          {
            id: 14272,
            date_valeur: '2042-01-01',
            objectif: 16700,
          },
          {
            id: 14273,
            date_valeur: '2043-01-01',
            objectif: 15500,
          },
          {
            id: 14274,
            date_valeur: '2044-01-01',
            objectif: 14300,
          },
          {
            id: 14275,
            date_valeur: '2045-01-01',
            objectif: 13100,
          },
          {
            id: 14276,
            date_valeur: '2046-01-01',
            objectif: 11900,
          },
          {
            id: 14277,
            date_valeur: '2047-01-01',
            objectif: 10700,
          },
          {
            id: 14278,
            date_valeur: '2048-01-01',
            objectif: 9500,
          },
          {
            id: 14279,
            date_valeur: '2049-01-01',
            objectif: 8300,
          },
          {
            id: 14280,
            date_valeur: '2050-01-01',
            objectif: 7100,
          },
        ],
      },
      {
        definition: {
          id: 27,
          identifiant_referentiel: 'cae_1.if',
          titre:
            'Emissions de gaz à effet de serre - industrie - Papier-carton',
          titre_long:
            'Emissions de gaz à effet de serre secteur Industrie - Papier-carton',
          description: '',
          unite: 'teq CO2',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 14281,
            date_valeur: '2015-01-01',
            objectif: 13300,
          },
          {
            id: 14282,
            date_valeur: '2016-01-01',
            objectif: 13000,
          },
          {
            id: 14283,
            date_valeur: '2017-01-01',
            objectif: 12700,
          },
          {
            id: 14284,
            date_valeur: '2018-01-01',
            objectif: 12300,
          },
          {
            id: 14285,
            date_valeur: '2019-01-01',
            objectif: 12000,
          },
          {
            id: 14286,
            date_valeur: '2020-01-01',
            objectif: 11700,
          },
          {
            id: 14287,
            date_valeur: '2021-01-01',
            objectif: 11300,
          },
          {
            id: 14288,
            date_valeur: '2022-01-01',
            objectif: 11000,
          },
          {
            id: 14289,
            date_valeur: '2023-01-01',
            objectif: 10700,
          },
          {
            id: 14290,
            date_valeur: '2024-01-01',
            objectif: 10300,
          },
          {
            id: 14291,
            date_valeur: '2025-01-01',
            objectif: 10000,
          },
          {
            id: 14292,
            date_valeur: '2026-01-01',
            objectif: 9700,
          },
          {
            id: 14293,
            date_valeur: '2027-01-01',
            objectif: 9300,
          },
          {
            id: 14294,
            date_valeur: '2028-01-01',
            objectif: 9000,
          },
          {
            id: 14295,
            date_valeur: '2029-01-01',
            objectif: 8700,
          },
          {
            id: 14296,
            date_valeur: '2030-01-01',
            objectif: 8300,
          },
          {
            id: 14297,
            date_valeur: '2031-01-01',
            objectif: 7900,
          },
          {
            id: 14298,
            date_valeur: '2032-01-01',
            objectif: 7500,
          },
          {
            id: 14299,
            date_valeur: '2033-01-01',
            objectif: 7100,
          },
          {
            id: 14300,
            date_valeur: '2034-01-01',
            objectif: 6700,
          },
          {
            id: 14301,
            date_valeur: '2035-01-01',
            objectif: 6200,
          },
          {
            id: 14302,
            date_valeur: '2036-01-01',
            objectif: 5800,
          },
          {
            id: 14303,
            date_valeur: '2037-01-01',
            objectif: 5400,
          },
          {
            id: 14304,
            date_valeur: '2038-01-01',
            objectif: 5000,
          },
          {
            id: 14305,
            date_valeur: '2039-01-01',
            objectif: 4600,
          },
          {
            id: 14306,
            date_valeur: '2040-01-01',
            objectif: 4200,
          },
          {
            id: 14307,
            date_valeur: '2041-01-01',
            objectif: 3700,
          },
          {
            id: 14308,
            date_valeur: '2042-01-01',
            objectif: 3300,
          },
          {
            id: 14309,
            date_valeur: '2043-01-01',
            objectif: 2900,
          },
          {
            id: 14310,
            date_valeur: '2044-01-01',
            objectif: 2500,
          },
          {
            id: 14311,
            date_valeur: '2045-01-01',
            objectif: 2100,
          },
          {
            id: 14312,
            date_valeur: '2046-01-01',
            objectif: 1700,
          },
          {
            id: 14313,
            date_valeur: '2047-01-01',
            objectif: 1200,
          },
          {
            id: 14314,
            date_valeur: '2048-01-01',
            objectif: 800,
          },
          {
            id: 14315,
            date_valeur: '2049-01-01',
            objectif: 400,
          },
          {
            id: 14316,
            date_valeur: '2050-01-01',
            objectif: 0,
          },
        ],
      },
      {
        definition: {
          id: 28,
          identifiant_referentiel: 'cae_1.ig',
          titre:
            'Emissions de gaz à effet de serre - industrie - Autres industries',
          titre_long:
            'Emissions de gaz à effet de serre secteur Industrie - Autres industries',
          description: '',
          unite: 'teq CO2',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 14317,
            date_valeur: '2015-01-01',
            objectif: 6600,
          },
          {
            id: 14318,
            date_valeur: '2016-01-01',
            objectif: 11700,
          },
          {
            id: 14319,
            date_valeur: '2017-01-01',
            objectif: 17000,
          },
          {
            id: 14320,
            date_valeur: '2018-01-01',
            objectif: 17800,
          },
          {
            id: 14321,
            date_valeur: '2019-01-01',
            objectif: 18600,
          },
          {
            id: 14322,
            date_valeur: '2020-01-01',
            objectif: 19400,
          },
          {
            id: 14323,
            date_valeur: '2021-01-01',
            objectif: 18300,
          },
          {
            id: 14324,
            date_valeur: '2022-01-01',
            objectif: 17200,
          },
          {
            id: 14325,
            date_valeur: '2023-01-01',
            objectif: 16200,
          },
          {
            id: 14326,
            date_valeur: '2024-01-01',
            objectif: 15100,
          },
          {
            id: 14327,
            date_valeur: '2025-01-01',
            objectif: 14100,
          },
          {
            id: 14328,
            date_valeur: '2026-01-01',
            objectif: 12000,
          },
          {
            id: 14329,
            date_valeur: '2027-01-01',
            objectif: 9900,
          },
          {
            id: 14330,
            date_valeur: '2028-01-01',
            objectif: 7800,
          },
          {
            id: 14331,
            date_valeur: '2029-01-01',
            objectif: 5700,
          },
          {
            id: 14332,
            date_valeur: '2030-01-01',
            objectif: 3700,
          },
          {
            id: 14333,
            date_valeur: '2031-01-01',
            objectif: 3600,
          },
          {
            id: 14334,
            date_valeur: '2032-01-01',
            objectif: 3500,
          },
          {
            id: 14335,
            date_valeur: '2033-01-01',
            objectif: 3500,
          },
          {
            id: 14336,
            date_valeur: '2034-01-01',
            objectif: 3400,
          },
          {
            id: 14337,
            date_valeur: '2035-01-01',
            objectif: 3300,
          },
          {
            id: 14338,
            date_valeur: '2036-01-01',
            objectif: 3100,
          },
          {
            id: 14339,
            date_valeur: '2037-01-01',
            objectif: 3000,
          },
          {
            id: 14340,
            date_valeur: '2038-01-01',
            objectif: 2900,
          },
          {
            id: 14341,
            date_valeur: '2039-01-01',
            objectif: 2700,
          },
          {
            id: 14342,
            date_valeur: '2040-01-01',
            objectif: 2500,
          },
          {
            id: 14343,
            date_valeur: '2041-01-01',
            objectif: 2300,
          },
          {
            id: 14344,
            date_valeur: '2042-01-01',
            objectif: 2100,
          },
          {
            id: 14345,
            date_valeur: '2043-01-01',
            objectif: 1900,
          },
          {
            id: 14346,
            date_valeur: '2044-01-01',
            objectif: 1700,
          },
          {
            id: 14347,
            date_valeur: '2045-01-01',
            objectif: 1400,
          },
          {
            id: 14348,
            date_valeur: '2046-01-01',
            objectif: 1200,
          },
          {
            id: 14349,
            date_valeur: '2047-01-01',
            objectif: 900,
          },
          {
            id: 14350,
            date_valeur: '2048-01-01',
            objectif: 600,
          },
          {
            id: 14351,
            date_valeur: '2049-01-01',
            objectif: 300,
          },
          {
            id: 14352,
            date_valeur: '2050-01-01',
            objectif: 0,
          },
        ],
      },
      {
        definition: {
          id: 29,
          identifiant_referentiel: 'cae_1.j',
          titre:
            "Emissions de gaz à effet de serre de l'industrie branche énergie",
          titre_long:
            "Emissions de gaz à effet de serre du secteur de l'industrie branche énergie",
          description: '',
          unite: 'teq CO2',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 14965,
            date_valeur: '2015-01-01',
            objectif: 0,
          },
          {
            id: 14966,
            date_valeur: '2016-01-01',
            objectif: 0,
          },
          {
            id: 14967,
            date_valeur: '2017-01-01',
            objectif: 0,
          },
          {
            id: 14968,
            date_valeur: '2018-01-01',
            objectif: 0,
          },
          {
            id: 14969,
            date_valeur: '2019-01-01',
            objectif: 0,
          },
          {
            id: 14970,
            date_valeur: '2020-01-01',
            objectif: 0,
          },
          {
            id: 14971,
            date_valeur: '2021-01-01',
            objectif: 0,
          },
          {
            id: 14972,
            date_valeur: '2022-01-01',
            objectif: 0,
          },
          {
            id: 14973,
            date_valeur: '2023-01-01',
            objectif: 0,
          },
          {
            id: 14974,
            date_valeur: '2024-01-01',
            objectif: 0,
          },
          {
            id: 14975,
            date_valeur: '2025-01-01',
            objectif: 0,
          },
          {
            id: 14976,
            date_valeur: '2026-01-01',
            objectif: 0,
          },
          {
            id: 14977,
            date_valeur: '2027-01-01',
            objectif: 0,
          },
          {
            id: 14978,
            date_valeur: '2028-01-01',
            objectif: 0,
          },
          {
            id: 14979,
            date_valeur: '2029-01-01',
            objectif: 0,
          },
          {
            id: 14980,
            date_valeur: '2030-01-01',
            objectif: 0,
          },
          {
            id: 14981,
            date_valeur: '2031-01-01',
            objectif: 0,
          },
          {
            id: 14982,
            date_valeur: '2032-01-01',
            objectif: 0,
          },
          {
            id: 14983,
            date_valeur: '2033-01-01',
            objectif: 0,
          },
          {
            id: 14984,
            date_valeur: '2034-01-01',
            objectif: 0,
          },
          {
            id: 14985,
            date_valeur: '2035-01-01',
            objectif: 0,
          },
          {
            id: 14986,
            date_valeur: '2036-01-01',
            objectif: 0,
          },
          {
            id: 14987,
            date_valeur: '2037-01-01',
            objectif: 0,
          },
          {
            id: 14988,
            date_valeur: '2038-01-01',
            objectif: 0,
          },
          {
            id: 14989,
            date_valeur: '2039-01-01',
            objectif: 0,
          },
          {
            id: 14990,
            date_valeur: '2040-01-01',
            objectif: 0,
          },
          {
            id: 14991,
            date_valeur: '2041-01-01',
            objectif: 0,
          },
          {
            id: 14992,
            date_valeur: '2042-01-01',
            objectif: 0,
          },
          {
            id: 14993,
            date_valeur: '2043-01-01',
            objectif: 0,
          },
          {
            id: 14994,
            date_valeur: '2044-01-01',
            objectif: 0,
          },
          {
            id: 14995,
            date_valeur: '2045-01-01',
            objectif: 0,
          },
          {
            id: 14996,
            date_valeur: '2046-01-01',
            objectif: 0,
          },
          {
            id: 14997,
            date_valeur: '2047-01-01',
            objectif: 0,
          },
          {
            id: 14998,
            date_valeur: '2048-01-01',
            objectif: 0,
          },
          {
            id: 14999,
            date_valeur: '2049-01-01',
            objectif: 0,
          },
          {
            id: 15000,
            date_valeur: '2050-01-01',
            objectif: 0,
          },
        ],
      },
      {
        definition: {
          id: 30,
          identifiant_referentiel: 'cae_1.k',
          titre: 'Emissions de gaz à effet de serre - Transports',
          titre_long: 'Emissions de gaz à effet de serre secteur Transports',
          description:
            '<p>Somme des transports routiers (cae_1.e) et autres transports (cae_1.f)</p>\n',
          unite: 'teq CO2',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 14893,
            date_valeur: '2015-01-01',
            objectif: 675090,
          },
          {
            id: 14894,
            date_valeur: '2016-01-01',
            objectif: 674220,
          },
          {
            id: 14895,
            date_valeur: '2017-01-01',
            objectif: 667520,
          },
          {
            id: 14896,
            date_valeur: '2018-01-01',
            objectif: 660820,
          },
          {
            id: 14897,
            date_valeur: '2019-01-01',
            objectif: 654620,
          },
          {
            id: 14898,
            date_valeur: '2020-01-01',
            objectif: 648230,
          },
          {
            id: 14899,
            date_valeur: '2021-01-01',
            objectif: 632470,
          },
          {
            id: 14900,
            date_valeur: '2022-01-01',
            objectif: 616510,
          },
          {
            id: 14901,
            date_valeur: '2023-01-01',
            objectif: 600580,
          },
          {
            id: 14902,
            date_valeur: '2024-01-01',
            objectif: 584570,
          },
          {
            id: 14903,
            date_valeur: '2025-01-01',
            objectif: 568530,
          },
          {
            id: 14904,
            date_valeur: '2026-01-01',
            objectif: 551430,
          },
          {
            id: 14905,
            date_valeur: '2027-01-01',
            objectif: 534490,
          },
          {
            id: 14906,
            date_valeur: '2028-01-01',
            objectif: 517390,
          },
          {
            id: 14907,
            date_valeur: '2029-01-01',
            objectif: 500430,
          },
          {
            id: 14908,
            date_valeur: '2030-01-01',
            objectif: 483320,
          },
          {
            id: 14909,
            date_valeur: '2031-01-01',
            objectif: 458500,
          },
          {
            id: 14910,
            date_valeur: '2032-01-01',
            objectif: 433810,
          },
          {
            id: 14911,
            date_valeur: '2033-01-01',
            objectif: 409120,
          },
          {
            id: 14912,
            date_valeur: '2034-01-01',
            objectif: 384680,
          },
          {
            id: 14913,
            date_valeur: '2035-01-01',
            objectif: 360250,
          },
          {
            id: 14914,
            date_valeur: '2036-01-01',
            objectif: 335960,
          },
          {
            id: 14915,
            date_valeur: '2037-01-01',
            objectif: 311720,
          },
          {
            id: 14916,
            date_valeur: '2038-01-01',
            objectif: 287700,
          },
          {
            id: 14917,
            date_valeur: '2039-01-01',
            objectif: 263720,
          },
          {
            id: 14918,
            date_valeur: '2040-01-01',
            objectif: 239900,
          },
          {
            id: 14919,
            date_valeur: '2041-01-01',
            objectif: 216130,
          },
          {
            id: 14920,
            date_valeur: '2042-01-01',
            objectif: 192570,
          },
          {
            id: 14921,
            date_valeur: '2043-01-01',
            objectif: 169090,
          },
          {
            id: 14922,
            date_valeur: '2044-01-01',
            objectif: 145750,
          },
          {
            id: 14923,
            date_valeur: '2045-01-01',
            objectif: 122550,
          },
          {
            id: 14924,
            date_valeur: '2046-01-01',
            objectif: 99480,
          },
          {
            id: 14925,
            date_valeur: '2047-01-01',
            objectif: 76520,
          },
          {
            id: 14926,
            date_valeur: '2048-01-01',
            objectif: 53700,
          },
          {
            id: 14927,
            date_valeur: '2049-01-01',
            objectif: 31030,
          },
          {
            id: 14928,
            date_valeur: '2050-01-01',
            objectif: 8500,
          },
        ],
      },
    ],
    consommations_finales: [
      {
        definition: {
          id: 62,
          identifiant_referentiel: 'cae_2.e',
          titre: 'Consommation énergétique - résidentiel',
          titre_long: 'Consommation énergétique du résidentiel',
          description: '',
          unite: 'GWh',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 15001,
            date_valeur: '2015-01-01',
            objectif: 3609.24,
          },
          {
            id: 15002,
            date_valeur: '2016-01-01',
            objectif: 3581.17,
          },
          {
            id: 15003,
            date_valeur: '2017-01-01',
            objectif: 3552.22,
          },
          {
            id: 15004,
            date_valeur: '2018-01-01',
            objectif: 3537.29,
          },
          {
            id: 15005,
            date_valeur: '2019-01-01',
            objectif: 3530.92,
          },
          {
            id: 15006,
            date_valeur: '2020-01-01',
            objectif: 3520.98,
          },
          {
            id: 15007,
            date_valeur: '2021-01-01',
            objectif: 3458.54,
          },
          {
            id: 15008,
            date_valeur: '2022-01-01',
            objectif: 3392.33,
          },
          {
            id: 15009,
            date_valeur: '2023-01-01',
            objectif: 3328.51,
          },
          {
            id: 15010,
            date_valeur: '2024-01-01',
            objectif: 3265.17,
          },
          {
            id: 15011,
            date_valeur: '2025-01-01',
            objectif: 3205.59,
          },
          {
            id: 15012,
            date_valeur: '2026-01-01',
            objectif: 3146.12,
          },
          {
            id: 15013,
            date_valeur: '2027-01-01',
            objectif: 3092.07,
          },
          {
            id: 15014,
            date_valeur: '2028-01-01',
            objectif: 3037.47,
          },
          {
            id: 15015,
            date_valeur: '2029-01-01',
            objectif: 2985.65,
          },
          {
            id: 15016,
            date_valeur: '2030-01-01',
            objectif: 2930.33,
          },
          {
            id: 15017,
            date_valeur: '2031-01-01',
            objectif: 2918.85,
          },
          {
            id: 15018,
            date_valeur: '2032-01-01',
            objectif: 2904.25,
          },
          {
            id: 15019,
            date_valeur: '2033-01-01',
            objectif: 2883.16,
          },
          {
            id: 15020,
            date_valeur: '2034-01-01',
            objectif: 2861.4,
          },
          {
            id: 15021,
            date_valeur: '2035-01-01',
            objectif: 2834.02,
          },
          {
            id: 15022,
            date_valeur: '2036-01-01',
            objectif: 2804.27,
          },
          {
            id: 15023,
            date_valeur: '2037-01-01',
            objectif: 2771.16,
          },
          {
            id: 15024,
            date_valeur: '2038-01-01',
            objectif: 2742.56,
          },
          {
            id: 15025,
            date_valeur: '2039-01-01',
            objectif: 2710.49,
          },
          {
            id: 15026,
            date_valeur: '2040-01-01',
            objectif: 2673.86,
          },
          {
            id: 15027,
            date_valeur: '2041-01-01',
            objectif: 2634.41,
          },
          {
            id: 15028,
            date_valeur: '2042-01-01',
            objectif: 2597.76,
          },
          {
            id: 15029,
            date_valeur: '2043-01-01',
            objectif: 2559.11,
          },
          {
            id: 15030,
            date_valeur: '2044-01-01',
            objectif: 2523.36,
          },
          {
            id: 15031,
            date_valeur: '2045-01-01',
            objectif: 2488.28,
          },
          {
            id: 15032,
            date_valeur: '2046-01-01',
            objectif: 2453.23,
          },
          {
            id: 15033,
            date_valeur: '2047-01-01',
            objectif: 2418.26,
          },
          {
            id: 15034,
            date_valeur: '2048-01-01',
            objectif: 2385.04,
          },
          {
            id: 15035,
            date_valeur: '2049-01-01',
            objectif: 2351.75,
          },
          {
            id: 15036,
            date_valeur: '2050-01-01',
            objectif: 2319.05,
          },
        ],
      },
      {
        definition: {
          id: 63,
          identifiant_referentiel: 'cae_2.ea',
          titre:
            'Consommation énergétique - résidentiel - Chauffage / Maisons individuelles',
          titre_long:
            'Consommation énergétique secteur résidentiel - Chauffage / Maisons individuelles',
          description: '',
          unite: 'GWh',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 14569,
            date_valeur: '2015-01-01',
            objectif: 763.9,
          },
          {
            id: 14570,
            date_valeur: '2016-01-01',
            objectif: 765.5,
          },
          {
            id: 14571,
            date_valeur: '2017-01-01',
            objectif: 767.4,
          },
          {
            id: 14572,
            date_valeur: '2018-01-01',
            objectif: 765.9,
          },
          {
            id: 14573,
            date_valeur: '2019-01-01',
            objectif: 766.1,
          },
          {
            id: 14574,
            date_valeur: '2020-01-01',
            objectif: 765.7,
          },
          {
            id: 14575,
            date_valeur: '2021-01-01',
            objectif: 753.2,
          },
          {
            id: 14576,
            date_valeur: '2022-01-01',
            objectif: 740.3,
          },
          {
            id: 14577,
            date_valeur: '2023-01-01',
            objectif: 727.1,
          },
          {
            id: 14578,
            date_valeur: '2024-01-01',
            objectif: 713.3,
          },
          {
            id: 14579,
            date_valeur: '2025-01-01',
            objectif: 698.5,
          },
          {
            id: 14580,
            date_valeur: '2026-01-01',
            objectif: 682.3,
          },
          {
            id: 14581,
            date_valeur: '2027-01-01',
            objectif: 665.9,
          },
          {
            id: 14582,
            date_valeur: '2028-01-01',
            objectif: 648.4,
          },
          {
            id: 14583,
            date_valeur: '2029-01-01',
            objectif: 631.2,
          },
          {
            id: 14584,
            date_valeur: '2030-01-01',
            objectif: 613.7,
          },
          {
            id: 14585,
            date_valeur: '2031-01-01',
            objectif: 596.9,
          },
          {
            id: 14586,
            date_valeur: '2032-01-01',
            objectif: 581.2,
          },
          {
            id: 14587,
            date_valeur: '2033-01-01',
            objectif: 566,
          },
          {
            id: 14588,
            date_valeur: '2034-01-01',
            objectif: 552.3,
          },
          {
            id: 14589,
            date_valeur: '2035-01-01',
            objectif: 539,
          },
          {
            id: 14590,
            date_valeur: '2036-01-01',
            objectif: 526.5,
          },
          {
            id: 14591,
            date_valeur: '2037-01-01',
            objectif: 514.2,
          },
          {
            id: 14592,
            date_valeur: '2038-01-01',
            objectif: 502,
          },
          {
            id: 14593,
            date_valeur: '2039-01-01',
            objectif: 489.8,
          },
          {
            id: 14594,
            date_valeur: '2040-01-01',
            objectif: 479.2,
          },
          {
            id: 14595,
            date_valeur: '2041-01-01',
            objectif: 468.3,
          },
          {
            id: 14596,
            date_valeur: '2042-01-01',
            objectif: 458.1,
          },
          {
            id: 14597,
            date_valeur: '2043-01-01',
            objectif: 447.6,
          },
          {
            id: 14598,
            date_valeur: '2044-01-01',
            objectif: 436.7,
          },
          {
            id: 14599,
            date_valeur: '2045-01-01',
            objectif: 426,
          },
          {
            id: 14600,
            date_valeur: '2046-01-01',
            objectif: 415.3,
          },
          {
            id: 14601,
            date_valeur: '2047-01-01',
            objectif: 404,
          },
          {
            id: 14602,
            date_valeur: '2048-01-01',
            objectif: 392.6,
          },
          {
            id: 14603,
            date_valeur: '2049-01-01',
            objectif: 381.3,
          },
          {
            id: 14604,
            date_valeur: '2050-01-01',
            objectif: 370.2,
          },
        ],
      },
      {
        definition: {
          id: 64,
          identifiant_referentiel: 'cae_2.eb',
          titre:
            'Consommation énergétique - résidentiel - Chauffage / Logement collectif',
          titre_long:
            'Consommation énergétique secteur résidentiel - Chauffage / Logement collectif',
          description: '',
          unite: 'GWh',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 14605,
            date_valeur: '2015-01-01',
            objectif: 1494.7,
          },
          {
            id: 14606,
            date_valeur: '2016-01-01',
            objectif: 1480,
          },
          {
            id: 14607,
            date_valeur: '2017-01-01',
            objectif: 1464.2,
          },
          {
            id: 14608,
            date_valeur: '2018-01-01',
            objectif: 1465.6,
          },
          {
            id: 14609,
            date_valeur: '2019-01-01',
            objectif: 1470.9,
          },
          {
            id: 14610,
            date_valeur: '2020-01-01',
            objectif: 1474.3,
          },
          {
            id: 14611,
            date_valeur: '2021-01-01',
            objectif: 1456.6,
          },
          {
            id: 14612,
            date_valeur: '2022-01-01',
            objectif: 1436.3,
          },
          {
            id: 14613,
            date_valeur: '2023-01-01',
            objectif: 1418,
          },
          {
            id: 14614,
            date_valeur: '2024-01-01',
            objectif: 1400.8,
          },
          {
            id: 14615,
            date_valeur: '2025-01-01',
            objectif: 1388,
          },
          {
            id: 14616,
            date_valeur: '2026-01-01',
            objectif: 1377.5,
          },
          {
            id: 14617,
            date_valeur: '2027-01-01',
            objectif: 1371.2,
          },
          {
            id: 14618,
            date_valeur: '2028-01-01',
            objectif: 1366.1,
          },
          {
            id: 14619,
            date_valeur: '2029-01-01',
            objectif: 1362.2,
          },
          {
            id: 14620,
            date_valeur: '2030-01-01',
            objectif: 1355.6,
          },
          {
            id: 14621,
            date_valeur: '2031-01-01',
            objectif: 1345.4,
          },
          {
            id: 14622,
            date_valeur: '2032-01-01',
            objectif: 1331.4,
          },
          {
            id: 14623,
            date_valeur: '2033-01-01',
            objectif: 1311.7,
          },
          {
            id: 14624,
            date_valeur: '2034-01-01',
            objectif: 1289.4,
          },
          {
            id: 14625,
            date_valeur: '2035-01-01',
            objectif: 1262.4,
          },
          {
            id: 14626,
            date_valeur: '2036-01-01',
            objectif: 1232.8,
          },
          {
            id: 14627,
            date_valeur: '2037-01-01',
            objectif: 1200.7,
          },
          {
            id: 14628,
            date_valeur: '2038-01-01',
            objectif: 1172.6,
          },
          {
            id: 14629,
            date_valeur: '2039-01-01',
            objectif: 1142.6,
          },
          {
            id: 14630,
            date_valeur: '2040-01-01',
            objectif: 1106.6,
          },
          {
            id: 14631,
            date_valeur: '2041-01-01',
            objectif: 1069.6,
          },
          {
            id: 14632,
            date_valeur: '2042-01-01',
            objectif: 1034.2,
          },
          {
            id: 14633,
            date_valeur: '2043-01-01',
            objectif: 998.6,
          },
          {
            id: 14634,
            date_valeur: '2044-01-01',
            objectif: 966.5,
          },
          {
            id: 14635,
            date_valeur: '2045-01-01',
            objectif: 935.4,
          },
          {
            id: 14636,
            date_valeur: '2046-01-01',
            objectif: 905,
          },
          {
            id: 14637,
            date_valeur: '2047-01-01',
            objectif: 876.7,
          },
          {
            id: 14638,
            date_valeur: '2048-01-01',
            objectif: 850.7,
          },
          {
            id: 14639,
            date_valeur: '2049-01-01',
            objectif: 825.1,
          },
          {
            id: 14640,
            date_valeur: '2050-01-01',
            objectif: 800.2,
          },
        ],
      },
      {
        definition: {
          id: 65,
          identifiant_referentiel: 'cae_2.ec',
          titre: 'Consommation énergétique - résidentiel - Autres usages',
          titre_long:
            'Consommation énergétique secteur résidentiel - Autres usages',
          description: '',
          unite: 'GWh',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 14641,
            date_valeur: '2015-01-01',
            objectif: 1350.6,
          },
          {
            id: 14642,
            date_valeur: '2016-01-01',
            objectif: 1335.6,
          },
          {
            id: 14643,
            date_valeur: '2017-01-01',
            objectif: 1320.7,
          },
          {
            id: 14644,
            date_valeur: '2018-01-01',
            objectif: 1305.8,
          },
          {
            id: 14645,
            date_valeur: '2019-01-01',
            objectif: 1294,
          },
          {
            id: 14646,
            date_valeur: '2020-01-01',
            objectif: 1281,
          },
          {
            id: 14647,
            date_valeur: '2021-01-01',
            objectif: 1248.7,
          },
          {
            id: 14648,
            date_valeur: '2022-01-01',
            objectif: 1215.8,
          },
          {
            id: 14649,
            date_valeur: '2023-01-01',
            objectif: 1183.4,
          },
          {
            id: 14650,
            date_valeur: '2024-01-01',
            objectif: 1151.1,
          },
          {
            id: 14651,
            date_valeur: '2025-01-01',
            objectif: 1119.1,
          },
          {
            id: 14652,
            date_valeur: '2026-01-01',
            objectif: 1086.4,
          },
          {
            id: 14653,
            date_valeur: '2027-01-01',
            objectif: 1055,
          },
          {
            id: 14654,
            date_valeur: '2028-01-01',
            objectif: 1023.1,
          },
          {
            id: 14655,
            date_valeur: '2029-01-01',
            objectif: 992.3,
          },
          {
            id: 14656,
            date_valeur: '2030-01-01',
            objectif: 961.1,
          },
          {
            id: 14657,
            date_valeur: '2031-01-01',
            objectif: 976.6,
          },
          {
            id: 14658,
            date_valeur: '2032-01-01',
            objectif: 991.7,
          },
          {
            id: 14659,
            date_valeur: '2033-01-01',
            objectif: 1005.5,
          },
          {
            id: 14660,
            date_valeur: '2034-01-01',
            objectif: 1019.7,
          },
          {
            id: 14661,
            date_valeur: '2035-01-01',
            objectif: 1032.6,
          },
          {
            id: 14662,
            date_valeur: '2036-01-01',
            objectif: 1045,
          },
          {
            id: 14663,
            date_valeur: '2037-01-01',
            objectif: 1056.3,
          },
          {
            id: 14664,
            date_valeur: '2038-01-01',
            objectif: 1067.9,
          },
          {
            id: 14665,
            date_valeur: '2039-01-01',
            objectif: 1078.1,
          },
          {
            id: 14666,
            date_valeur: '2040-01-01',
            objectif: 1088,
          },
          {
            id: 14667,
            date_valeur: '2041-01-01',
            objectif: 1096.5,
          },
          {
            id: 14668,
            date_valeur: '2042-01-01',
            objectif: 1105.5,
          },
          {
            id: 14669,
            date_valeur: '2043-01-01',
            objectif: 1113,
          },
          {
            id: 14670,
            date_valeur: '2044-01-01',
            objectif: 1120.2,
          },
          {
            id: 14671,
            date_valeur: '2045-01-01',
            objectif: 1126.9,
          },
          {
            id: 14672,
            date_valeur: '2046-01-01',
            objectif: 1133,
          },
          {
            id: 14673,
            date_valeur: '2047-01-01',
            objectif: 1137.6,
          },
          {
            id: 14674,
            date_valeur: '2048-01-01',
            objectif: 1141.8,
          },
          {
            id: 14675,
            date_valeur: '2049-01-01',
            objectif: 1145.3,
          },
          {
            id: 14676,
            date_valeur: '2050-01-01',
            objectif: 1148.6,
          },
        ],
      },
      {
        definition: {
          id: 66,
          identifiant_referentiel: 'cae_2.f',
          titre: 'Consommation énergétique - tertiaire',
          titre_long: 'Consommation énergétique du tertiaire',
          description: '',
          unite: 'GWh',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 15037,
            date_valeur: '2015-01-01',
            objectif: 3198.84,
          },
          {
            id: 15038,
            date_valeur: '2016-01-01',
            objectif: 3177.51,
          },
          {
            id: 15039,
            date_valeur: '2017-01-01',
            objectif: 3156.22,
          },
          {
            id: 15040,
            date_valeur: '2018-01-01',
            objectif: 3134.95,
          },
          {
            id: 15041,
            date_valeur: '2019-01-01',
            objectif: 3120.82,
          },
          {
            id: 15042,
            date_valeur: '2020-01-01',
            objectif: 3103.89,
          },
          {
            id: 15043,
            date_valeur: '2021-01-01',
            objectif: 3054.93,
          },
          {
            id: 15044,
            date_valeur: '2022-01-01',
            objectif: 3003.59,
          },
          {
            id: 15045,
            date_valeur: '2023-01-01',
            objectif: 2953.13,
          },
          {
            id: 15046,
            date_valeur: '2024-01-01',
            objectif: 2901.89,
          },
          {
            id: 15047,
            date_valeur: '2025-01-01',
            objectif: 2850.72,
          },
          {
            id: 15048,
            date_valeur: '2026-01-01',
            objectif: 2797.11,
          },
          {
            id: 15049,
            date_valeur: '2027-01-01',
            objectif: 2745.94,
          },
          {
            id: 15050,
            date_valeur: '2028-01-01',
            objectif: 2692.62,
          },
          {
            id: 15051,
            date_valeur: '2029-01-01',
            objectif: 2641.48,
          },
          {
            id: 15052,
            date_valeur: '2030-01-01',
            objectif: 2588.46,
          },
          {
            id: 15053,
            date_valeur: '2031-01-01',
            objectif: 2557.93,
          },
          {
            id: 15054,
            date_valeur: '2032-01-01',
            objectif: 2527.8,
          },
          {
            id: 15055,
            date_valeur: '2033-01-01',
            objectif: 2495.38,
          },
          {
            id: 15056,
            date_valeur: '2034-01-01',
            objectif: 2465.51,
          },
          {
            id: 15057,
            date_valeur: '2035-01-01',
            objectif: 2433.48,
          },
          {
            id: 15058,
            date_valeur: '2036-01-01',
            objectif: 2401.58,
          },
          {
            id: 15059,
            date_valeur: '2037-01-01',
            objectif: 2368.34,
          },
          {
            id: 15060,
            date_valeur: '2038-01-01',
            objectif: 2337.11,
          },
          {
            id: 15061,
            date_valeur: '2039-01-01',
            objectif: 2303.9,
          },
          {
            id: 15062,
            date_valeur: '2040-01-01',
            objectif: 2271.39,
          },
          {
            id: 15063,
            date_valeur: '2041-01-01',
            objectif: 2236.83,
          },
          {
            id: 15064,
            date_valeur: '2042-01-01',
            objectif: 2204.57,
          },
          {
            id: 15065,
            date_valeur: '2043-01-01',
            objectif: 2170.48,
          },
          {
            id: 15066,
            date_valeur: '2044-01-01',
            objectif: 2136.82,
          },
          {
            id: 15067,
            date_valeur: '2045-01-01',
            objectif: 2103.36,
          },
          {
            id: 15068,
            date_valeur: '2046-01-01',
            objectif: 2069.77,
          },
          {
            id: 15069,
            date_valeur: '2047-01-01',
            objectif: 2034.52,
          },
          {
            id: 15070,
            date_valeur: '2048-01-01',
            objectif: 1999.68,
          },
          {
            id: 15071,
            date_valeur: '2049-01-01',
            objectif: 1964.73,
          },
          {
            id: 15072,
            date_valeur: '2050-01-01',
            objectif: 1930.28,
          },
        ],
      },
      {
        definition: {
          id: 67,
          identifiant_referentiel: 'cae_2.fa',
          titre: 'Consommation énergétique - tertiaire - Chauffage',
          titre_long: 'Consommation énergétique secteur tertiaire - Chauffage',
          description: '',
          unite: 'GWh',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 14677,
            date_valeur: '2015-01-01',
            objectif: 1404.8,
          },
          {
            id: 14678,
            date_valeur: '2016-01-01',
            objectif: 1382.3,
          },
          {
            id: 14679,
            date_valeur: '2017-01-01',
            objectif: 1360.1,
          },
          {
            id: 14680,
            date_valeur: '2018-01-01',
            objectif: 1338,
          },
          {
            id: 14681,
            date_valeur: '2019-01-01',
            objectif: 1319.1,
          },
          {
            id: 14682,
            date_valeur: '2020-01-01',
            objectif: 1299.1,
          },
          {
            id: 14683,
            date_valeur: '2021-01-01',
            objectif: 1266,
          },
          {
            id: 14684,
            date_valeur: '2022-01-01',
            objectif: 1232.3,
          },
          {
            id: 14685,
            date_valeur: '2023-01-01',
            objectif: 1199.4,
          },
          {
            id: 14686,
            date_valeur: '2024-01-01',
            objectif: 1166.5,
          },
          {
            id: 14687,
            date_valeur: '2025-01-01',
            objectif: 1134.1,
          },
          {
            id: 14688,
            date_valeur: '2026-01-01',
            objectif: 1101.1,
          },
          {
            id: 14689,
            date_valeur: '2027-01-01',
            objectif: 1069.5,
          },
          {
            id: 14690,
            date_valeur: '2028-01-01',
            objectif: 1037.5,
          },
          {
            id: 14691,
            date_valeur: '2029-01-01',
            objectif: 1006.8,
          },
          {
            id: 14692,
            date_valeur: '2030-01-01',
            objectif: 975.8,
          },
          {
            id: 14693,
            date_valeur: '2031-01-01',
            objectif: 961.6,
          },
          {
            id: 14694,
            date_valeur: '2032-01-01',
            objectif: 947.6,
          },
          {
            id: 14695,
            date_valeur: '2033-01-01',
            objectif: 932.8,
          },
          {
            id: 14696,
            date_valeur: '2034-01-01',
            objectif: 919.1,
          },
          {
            id: 14697,
            date_valeur: '2035-01-01',
            objectif: 904.6,
          },
          {
            id: 14698,
            date_valeur: '2036-01-01',
            objectif: 890.2,
          },
          {
            id: 14699,
            date_valeur: '2037-01-01',
            objectif: 875.4,
          },
          {
            id: 14700,
            date_valeur: '2038-01-01',
            objectif: 861.4,
          },
          {
            id: 14701,
            date_valeur: '2039-01-01',
            objectif: 846.8,
          },
          {
            id: 14702,
            date_valeur: '2040-01-01',
            objectif: 832.4,
          },
          {
            id: 14703,
            date_valeur: '2041-01-01',
            objectif: 817.4,
          },
          {
            id: 14704,
            date_valeur: '2042-01-01',
            objectif: 803.3,
          },
          {
            id: 14705,
            date_valeur: '2043-01-01',
            objectif: 788.6,
          },
          {
            id: 14706,
            date_valeur: '2044-01-01',
            objectif: 774.1,
          },
          {
            id: 14707,
            date_valeur: '2045-01-01',
            objectif: 759.8,
          },
          {
            id: 14708,
            date_valeur: '2046-01-01',
            objectif: 745.5,
          },
          {
            id: 14709,
            date_valeur: '2047-01-01',
            objectif: 730.6,
          },
          {
            id: 14710,
            date_valeur: '2048-01-01',
            objectif: 716,
          },
          {
            id: 14711,
            date_valeur: '2049-01-01',
            objectif: 701.4,
          },
          {
            id: 14712,
            date_valeur: '2050-01-01',
            objectif: 687.1,
          },
        ],
      },
      {
        definition: {
          id: 68,
          identifiant_referentiel: 'cae_2.fb',
          titre: 'Consommation énergétique - tertiaire - Autres usages',
          titre_long:
            'Consommation énergétique secteur tertiaire - Autres usages',
          description: '',
          unite: 'GWh',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 14713,
            date_valeur: '2015-01-01',
            objectif: 1794.1,
          },
          {
            id: 14714,
            date_valeur: '2016-01-01',
            objectif: 1795.2,
          },
          {
            id: 14715,
            date_valeur: '2017-01-01',
            objectif: 1796.1,
          },
          {
            id: 14716,
            date_valeur: '2018-01-01',
            objectif: 1796.9,
          },
          {
            id: 14717,
            date_valeur: '2019-01-01',
            objectif: 1801.7,
          },
          {
            id: 14718,
            date_valeur: '2020-01-01',
            objectif: 1804.7,
          },
          {
            id: 14719,
            date_valeur: '2021-01-01',
            objectif: 1788.9,
          },
          {
            id: 14720,
            date_valeur: '2022-01-01',
            objectif: 1771.3,
          },
          {
            id: 14721,
            date_valeur: '2023-01-01',
            objectif: 1753.8,
          },
          {
            id: 14722,
            date_valeur: '2024-01-01',
            objectif: 1735.4,
          },
          {
            id: 14723,
            date_valeur: '2025-01-01',
            objectif: 1716.6,
          },
          {
            id: 14724,
            date_valeur: '2026-01-01',
            objectif: 1696,
          },
          {
            id: 14725,
            date_valeur: '2027-01-01',
            objectif: 1676.4,
          },
          {
            id: 14726,
            date_valeur: '2028-01-01',
            objectif: 1655.1,
          },
          {
            id: 14727,
            date_valeur: '2029-01-01',
            objectif: 1634.7,
          },
          {
            id: 14728,
            date_valeur: '2030-01-01',
            objectif: 1612.7,
          },
          {
            id: 14729,
            date_valeur: '2031-01-01',
            objectif: 1596.4,
          },
          {
            id: 14730,
            date_valeur: '2032-01-01',
            objectif: 1580.2,
          },
          {
            id: 14731,
            date_valeur: '2033-01-01',
            objectif: 1562.6,
          },
          {
            id: 14732,
            date_valeur: '2034-01-01',
            objectif: 1546.4,
          },
          {
            id: 14733,
            date_valeur: '2035-01-01',
            objectif: 1528.9,
          },
          {
            id: 14734,
            date_valeur: '2036-01-01',
            objectif: 1511.4,
          },
          {
            id: 14735,
            date_valeur: '2037-01-01',
            objectif: 1492.9,
          },
          {
            id: 14736,
            date_valeur: '2038-01-01',
            objectif: 1475.7,
          },
          {
            id: 14737,
            date_valeur: '2039-01-01',
            objectif: 1457.2,
          },
          {
            id: 14738,
            date_valeur: '2040-01-01',
            objectif: 1439,
          },
          {
            id: 14739,
            date_valeur: '2041-01-01',
            objectif: 1419.4,
          },
          {
            id: 14740,
            date_valeur: '2042-01-01',
            objectif: 1401.3,
          },
          {
            id: 14741,
            date_valeur: '2043-01-01',
            objectif: 1381.9,
          },
          {
            id: 14742,
            date_valeur: '2044-01-01',
            objectif: 1362.7,
          },
          {
            id: 14743,
            date_valeur: '2045-01-01',
            objectif: 1343.6,
          },
          {
            id: 14744,
            date_valeur: '2046-01-01',
            objectif: 1324.3,
          },
          {
            id: 14745,
            date_valeur: '2047-01-01',
            objectif: 1303.9,
          },
          {
            id: 14746,
            date_valeur: '2048-01-01',
            objectif: 1283.7,
          },
          {
            id: 14747,
            date_valeur: '2049-01-01',
            objectif: 1263.3,
          },
          {
            id: 14748,
            date_valeur: '2050-01-01',
            objectif: 1243.2,
          },
        ],
      },
      {
        definition: {
          id: 71,
          identifiant_referentiel: 'cae_2.i',
          titre: 'Consommation énergétique - agriculture',
          titre_long: "Consommation énergétique de l'agriculture",
          description: '',
          unite: 'GWh',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 15073,
            date_valeur: '2015-01-01',
            objectif: 23.14,
          },
          {
            id: 15074,
            date_valeur: '2016-01-01',
            objectif: 22.98,
          },
          {
            id: 15075,
            date_valeur: '2017-01-01',
            objectif: 22.81,
          },
          {
            id: 15076,
            date_valeur: '2018-01-01',
            objectif: 22.65,
          },
          {
            id: 15077,
            date_valeur: '2019-01-01',
            objectif: 22.49,
          },
          {
            id: 15078,
            date_valeur: '2020-01-01',
            objectif: 22.32,
          },
          {
            id: 15079,
            date_valeur: '2021-01-01',
            objectif: 22.03,
          },
          {
            id: 15080,
            date_valeur: '2022-01-01',
            objectif: 21.73,
          },
          {
            id: 15081,
            date_valeur: '2023-01-01',
            objectif: 21.43,
          },
          {
            id: 15082,
            date_valeur: '2024-01-01',
            objectif: 21.14,
          },
          {
            id: 15083,
            date_valeur: '2025-01-01',
            objectif: 20.84,
          },
          {
            id: 15084,
            date_valeur: '2026-01-01',
            objectif: 20.68,
          },
          {
            id: 15085,
            date_valeur: '2027-01-01',
            objectif: 20.53,
          },
          {
            id: 15086,
            date_valeur: '2028-01-01',
            objectif: 20.37,
          },
          {
            id: 15087,
            date_valeur: '2029-01-01',
            objectif: 20.21,
          },
          {
            id: 15088,
            date_valeur: '2030-01-01',
            objectif: 20.06,
          },
          {
            id: 15089,
            date_valeur: '2031-01-01',
            objectif: 19.65,
          },
          {
            id: 15090,
            date_valeur: '2032-01-01',
            objectif: 19.23,
          },
          {
            id: 15091,
            date_valeur: '2033-01-01',
            objectif: 18.82,
          },
          {
            id: 15092,
            date_valeur: '2034-01-01',
            objectif: 18.41,
          },
          {
            id: 15093,
            date_valeur: '2035-01-01',
            objectif: 18,
          },
          {
            id: 15094,
            date_valeur: '2036-01-01',
            objectif: 17.59,
          },
          {
            id: 15095,
            date_valeur: '2037-01-01',
            objectif: 17.17,
          },
          {
            id: 15096,
            date_valeur: '2038-01-01',
            objectif: 16.76,
          },
          {
            id: 15097,
            date_valeur: '2039-01-01',
            objectif: 16.35,
          },
          {
            id: 15098,
            date_valeur: '2040-01-01',
            objectif: 15.94,
          },
          {
            id: 15099,
            date_valeur: '2041-01-01',
            objectif: 15.52,
          },
          {
            id: 15100,
            date_valeur: '2042-01-01',
            objectif: 15.11,
          },
          {
            id: 15101,
            date_valeur: '2043-01-01',
            objectif: 14.7,
          },
          {
            id: 15102,
            date_valeur: '2044-01-01',
            objectif: 14.29,
          },
          {
            id: 15103,
            date_valeur: '2045-01-01',
            objectif: 13.88,
          },
          {
            id: 15104,
            date_valeur: '2046-01-01',
            objectif: 13.46,
          },
          {
            id: 15105,
            date_valeur: '2047-01-01',
            objectif: 13.05,
          },
          {
            id: 15106,
            date_valeur: '2048-01-01',
            objectif: 12.64,
          },
          {
            id: 15107,
            date_valeur: '2049-01-01',
            objectif: 12.23,
          },
          {
            id: 15108,
            date_valeur: '2050-01-01',
            objectif: 11.81,
          },
        ],
      },
      {
        definition: {
          id: 72,
          identifiant_referentiel: 'cae_2.j',
          titre: 'Consommation énergétique - déchets',
          titre_long: 'Consommation énergétique des déchets',
          description: '',
          unite: 'GWh',
          borne_min: null,
          borne_max: null,
        },
        valeurs: [
          {
            id: 15109,
            date_valeur: '2015-01-01',
            objectif: 0,
          },
          {
            id: 15110,
            date_valeur: '2016-01-01',
            objectif: 0,
          },
          {
            id: 15111,
            date_valeur: '2017-01-01',
            objectif: 0,
          },
          {
            id: 15112,
            date_valeur: '2018-01-01',
            objectif: 0,
          },
          {
            id: 15113,
            date_valeur: '2019-01-01',
            objectif: 0,
          },
          {
            id: 15114,
            date_valeur: '2020-01-01',
            objectif: 0,
          },
          {
            id: 15115,
            date_valeur: '2021-01-01',
            objectif: 0,
          },
          {
            id: 15116,
            date_valeur: '2022-01-01',
            objectif: 0,
          },
          {
            id: 15117,
            date_valeur: '2023-01-01',
            objectif: 0,
          },
          {
            id: 15118,
            date_valeur: '2024-01-01',
            objectif: 0,
          },
          {
            id: 15119,
            date_valeur: '2025-01-01',
            objectif: 0,
          },
          {
            id: 15120,
            date_valeur: '2026-01-01',
            objectif: 0,
          },
          {
            id: 15121,
            date_valeur: '2027-01-01',
            objectif: 0,
          },
          {
            id: 15122,
            date_valeur: '2028-01-01',
            objectif: 0,
          },
          {
            id: 15123,
            date_valeur: '2029-01-01',
            objectif: 0,
          },
          {
            id: 15124,
            date_valeur: '2030-01-01',
            objectif: 0,
          },
          {
            id: 15125,
            date_valeur: '2031-01-01',
            objectif: 0,
          },
          {
            id: 15126,
            date_valeur: '2032-01-01',
            objectif: 0,
          },
          {
            id: 15127,
            date_valeur: '2033-01-01',
            objectif: 0,
          },
          {
            id: 15128,
            date_valeur: '2034-01-01',
            objectif: 0,
          },
          {
            id: 15129,
            date_valeur: '2035-01-01',
            objectif: 0,
          },
          {
            id: 15130,
            date_valeur: '2036-01-01',
            objectif: 0,
          },
          {
            id: 15131,
            date_valeur: '2037-01-01',
            objectif: 0,
          },
          {
            id: 15132,
            date_valeur: '2038-01-01',
            objectif: 0,
          },
          {
            id: 15133,
            date_valeur: '2039-01-01',
            objectif: 0,
          },
          {
            id: 15134,
            date_valeur: '2040-01-01',
            objectif: 0,
          },
          {
            id: 15135,
            date_valeur: '2041-01-01',
            objectif: 0,
          },
          {
            id: 15136,
            date_valeur: '2042-01-01',
            objectif: 0,
          },
          {
            id: 15137,
            date_valeur: '2043-01-01',
            objectif: 0,
          },
          {
            id: 15138,
            date_valeur: '2044-01-01',
            objectif: 0,
          },
          {
            id: 15139,
            date_valeur: '2045-01-01',
            objectif: 0,
          },
          {
            id: 15140,
            date_valeur: '2046-01-01',
            objectif: 0,
          },
          {
            id: 15141,
            date_valeur: '2047-01-01',
            objectif: 0,
          },
          {
            id: 15142,
            date_valeur: '2048-01-01',
            objectif: 0,
          },
          {
            id: 15143,
            date_valeur: '2049-01-01',
            objectif: 0,
          },
          {
            id: 15144,
            date_valeur: '2050-01-01',
            objectif: 0,
          },
        ],
      },
    ],
    sequestrations: [],
  },
};
