import template from '@tet/backend/plans/ai-plan-import/electrification/extract-plan/__fixtures__/electrification-v4.template.json';
import type { ImportIndicateurReference } from '@tet/backend/indicateurs/import-indicateurs/import-indicateur-reference.dto';
import { failure, success } from '@tet/backend/utils/result.type';
import {
  ElectrificationConfig,
  electrificationConfigSchema,
  electrificationLaureatsConfigSchema,
} from '@tet/domain/plans';
import { ElectrificationDataService } from './electrification-data.service';

/** Identités du jeu synthétique V4, sans contrainte sur les catalogues publiés. */
export const ElectrificationEngagementCodeEnum = {
  SORTIE_FIOUL_LOGEMENTS_PRIVES: 'E01',
  SORTIE_GAZ_LOGEMENTS_PRIVES: 'E02',
  DECOMMISSIONNEMENT_RESEAU_GAZ: 'E03',
  SORTIE_GAZ_LOGEMENTS_SOCIAUX: 'E04',
  SORTIE_GAZ_BATIMENTS_PUBLICS: 'E05',
  ELECTRIFICATION_VEHICULES_PARTICULIERS: 'E06',
  BORNES_RECHARGE_PUBLIQUES: 'E07',
  ELECTRIFICATION_AUTOBUS: 'E08',
  ELECTRIFICATION_ARTISANS: 'E09',
  ELECTRIFICATION_INDUSTRIE: 'E10',
  ELECTRIFICATION_AGRICULTURE: 'E11',
  SITE_RECHARGE_POIDS_LOURDS: 'E12',
} as const;

const engagements = [
  ['E01', 1, '%'],
  ['E02', 1, '%'],
  ['E03', 4, null],
  ['E04', 2, '%'],
  ['E05', 3, '%'],
  ['E06', 5, '%'],
  ['E07', 6, 'Nombre de bornes'],
  ['E08', 8, '%'],
  ['E09', 9, 'nb'],
  ['E10', 10, 'MWh'],
  ['E11', 11, 'MWh'],
  ['E12', 7, null],
] as const;

/** Catalogue synthétique : cas de résolution, sans copie du référentiel Grist. */
export const electrificationCatalogueFixture: ElectrificationConfig = {
  version: 'test-catalogue',
  engagements: engagements.map(([code, axeNumero, unite]) => ({
    code,
    libelleSource:
      template.sections[0].rows[
        {
          E01: 1,
          E02: 2,
          E03: 5,
          E04: 3,
          E05: 4,
          E06: 6,
          E07: 7,
          E08: 9,
          E09: 10,
          E10: 11,
          E11: 12,
          E12: 8,
        }[code]
      ][code === 'E02' ? 0 : 1].text,
    axeNumero,
    actionTitre: unite === null ? `Action de test ${code}` : null,
    cibles:
      unite === null
        ? []
        : (code === 'E07' ? ['total', 'rapides'] : ['principale']).map(
            (key) => ({
              key,
              libelleSource: key,
              identifiantReferentiel: `test-${code}-${key}`,
              unite,
              uniteImport: code === 'E09' ? 'Nombre' : unite,
              reglesImport: {
                annee: 2030,
                minimum: 0,
                maximum: unite === '%' ? 100 : null,
                plafondCible: key === 'rapides' ? 'total' : null,
                libelles:
                  key === 'total'
                    ? ['total', 'publiques']
                    : key === 'rapides'
                    ? ['rapide', 'rapides']
                    : [],
                unites:
                  code === 'E07'
                    ? ['borne', 'bornes']
                    : code === 'E09'
                    ? ['artisan', 'artisans', 'nb']
                    : [],
              },
              periodicite: 'annuelle',
              validation: code === 'E07' ? 'validated' : 'pending',
            })
          ),
  })),
  axes: Array.from({ length: 11 }, (_, index) => ({
    numero: index + 1,
    titre: `Axe de test ${index + 1}`,
  })),
  sousAxes: [
    { numero: '1.1', axeNumero: 1, titre: 'Repérage' },
    { numero: '1.2', axeNumero: 1, titre: 'Accompagnement' },
    { numero: '1.4', axeNumero: 1, titre: 'Mobilisation' },
    { numero: '8.1', axeNumero: 8, titre: 'État des lieux' },
    { numero: '9.1', axeNumero: 9, titre: 'État des lieux' },
  ],
  fiches: {
    actions: [
      {
        code: '1.4.1',
        validation: 'validated',
        axeNumero: 1,
        sousAxeNumero: '1.4',
        champs: {
          titre: 'Action de mobilisation',
          description: 'Description du catalogue synthétique',
        },
        sousActions: [1, 2, 3].map((numero) => ({
          code: `sous-action-test-${numero}`,
          champs: { titre: `Sous-action synthétique ${numero}` },
        })),
        indicateurCodes: [],
        aides: [
          { titre: 'Aide de test', url: 'https://example.com/aide' },
          { titre: 'Guide de test', url: 'https://example.com/guide' },
        ],
      },
      {
        code: '1.1.2',
        validation: 'validated',
        axeNumero: 1,
        sousAxeNumero: '1.1',
        champs: { titre: 'Action avec un indicateur en attente' },
        sousActions: [],
        indicateurCodes: ['indicateur-en-attente'],
        aides: [],
      },
    ],
    indicateurs: [
      {
        code: 'indicateur-en-attente',
        type: 'quantitatif',
        validation: 'pending',
        identifiantReferentiel: null,
        unite: 'nb',
        periodicite: 'annuelle',
      },
    ],
  },
};

export const buildInMemoryElectrificationData = (
  current: { catalogue?: () => unknown; laureats?: () => unknown } = {}
) => {
  const catalogues = new Map<string, unknown>();
  const service: Pick<
    ElectrificationDataService,
    'getCatalogue' | 'getLaureats'
  > = {
    async getCatalogue(version) {
      const data =
        (version ? catalogues.get(version) : undefined) ??
        current.catalogue?.();
      if (data == null) return failure('DATA_UNAVAILABLE');
      const parsed = electrificationConfigSchema.safeParse(data);
      if (!parsed.success) return failure('INVALID_DATA');
      return version && parsed.data.version !== version
        ? failure('DATA_UNAVAILABLE')
        : success(parsed.data);
    },
    async getLaureats(version) {
      const data = current.laureats?.();
      if (data == null) return failure('DATA_UNAVAILABLE');
      const parsed = electrificationLaureatsConfigSchema.safeParse(data);
      if (!parsed.success) return failure('INVALID_DATA');
      return version && parsed.data.version !== version
        ? failure('DATA_UNAVAILABLE')
        : success(parsed.data);
    },
  };
  return { ...service, catalogues };
};

/** Correspondances seules : les définitions des engagements viennent de Grist. */
export const buildElectrificationReferencesFixture = (
  lienSource: string
): ImportIndicateurReference[] =>
  electrificationCatalogueFixture.engagements.flatMap((engagement) =>
    engagement.cibles.map((cible) => ({
      source: 'engagements-electrification',
      codeExterne: `${engagement.code}.${cible.key}`,
      lienSource,
    }))
  );
