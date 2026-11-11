import { failure, success } from '@tet/backend/utils/result.type';
import {
  ElectrificationConfig,
  electrificationConfigSchema,
  electrificationLaureatsConfigSchema,
} from '@tet/domain/plans';
import { ElectrificationDataService } from './electrification-data.service';

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
    axeNumero,
    actionTitre: unite === null ? `Action de test ${code}` : null,
    cibles:
      unite === null
        ? []
        : (code === 'E07' ? ['total', 'rapides'] : ['principale']).map(
            (key) => ({
              key,
              identifiantReferentiel: `test-${code}-${key}`,
              unite,
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
