import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import type {
  IndicateurPredefini,
  IndicateurValeur,
} from '@tet/domain/indicateurs';
import { toIndicateurRow } from '../../indicateur/indicateur-row.test-fixture';
import IndicateurSourcesService from '@tet/backend/indicateurs/sources/indicateur-sources.service';
import IndicateurExpressionService from '../indicateur-expression.service';
import { IndicateurValeurLockRepository } from '../indicateur-valeur-lock.repository';
import { ComputeValeursRepository } from './compute-valeurs.repository';
import ComputeValeursService from './compute-valeurs.service';
import { LoadIndicateurCalculGraphService } from './load-indicateur-calcul-graph.service';

const tx = {} as Transaction;
const valeurs = [{ id: 1, indicateurId: 1 }] as IndicateurValeur[];
const definition = toIndicateurRow({
  id: 10,
  identifiantReferentiel: 'cae_2',
  valeurCalcule: 'val(cae_1)',
}) as IndicateurPredefini;

const makeService = ({
  graphService = {},
  indicateurSourceService = {},
}: {
  graphService?: object;
  indicateurSourceService?: object;
}) => {
  const repository = {} as ComputeValeursRepository;
  const expressions = {} as IndicateurExpressionService;
  const valeurLockRepository = {} as IndicateurValeurLockRepository;
  return new ComputeValeursService(
    repository,
    graphService as LoadIndicateurCalculGraphService,
    indicateurSourceService as IndicateurSourcesService,
    expressions,
    valeurLockRepository
  );
};

describe('ComputeValeursService', () => {
  test('getAllSourceIdentifiants retourne l’échec d’analyse d’une formule', async () => {
    const syntaxError = new Error('Attendu « alors »');
    const service = makeService({
      graphService: {
        getFormula: vi.fn(() => failure('INVALID_EXPRESSION', syntaxError)),
      },
    });

    await expect(
      service.getAllSourceIdentifiants([definition])
    ).resolves.toEqual(failure('INVALID_EXPRESSION', syntaxError));
  });

  test('updateCalculatedIndicateurValeurs retourne l’échec du chargement du graphe', async () => {
    const loadError = new Error('graphe indisponible');
    const service = makeService({
      graphService: {
        loadDependants: vi
          .fn()
          .mockResolvedValue(failure('LOAD_CALCUL_GRAPH_FAILED', loadError)),
      },
    });

    await expect(
      service.updateCalculatedIndicateurValeurs(valeurs, tx)
    ).resolves.toEqual(failure('LOAD_CALCUL_GRAPH_FAILED', loadError));
  });

  test('updateCalculatedIndicateurValeurs retourne DATABASE_ERROR quand une lecture rejette', async () => {
    const readError = new Error('connexion perdue');
    const service = makeService({
      graphService: {
        loadDependants: vi.fn().mockResolvedValue(
          success({
            formulas: [{ definition, references: [] }],
            sourceIndicateurs: [],
            targetIndicateurs: [],
          })
        ),
      },
      indicateurSourceService: {
        getAllIndicateurSourceMetadonnees: vi.fn().mockRejectedValue(readError),
      },
    });

    await expect(
      service.updateCalculatedIndicateurValeurs(valeurs, tx)
    ).resolves.toEqual(failure('DATABASE_ERROR', readError));
  });

  test('reconcileDeletedIndicateurValeurs ne lit rien sans valeur supprimée', async () => {
    const service = makeService({});

    await expect(
      service.reconcileDeletedIndicateurValeurs([], tx)
    ).resolves.toEqual(success({ valeursToUpsert: [], valeurIdsToDelete: [] }));
  });
});
