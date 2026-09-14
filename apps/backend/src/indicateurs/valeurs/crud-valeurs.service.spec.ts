import { Test } from '@nestjs/testing';
import ComputeValeursService from '@tet/backend/indicateurs/valeurs/compute-valeurs.service';
import { GetUserRolesAndPermissionsService } from '@tet/backend/users/authorizations/get-user-roles-and-permissions/get-user-roles-and-permissions.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  AuthRole,
  ServiceRoleUser,
} from '@tet/backend/users/models/auth.models';
import {
  IndicateurAvecValeurs,
  IndicateurAvecValeursParSource,
  IndicateurDefinition,
  IndicateurDefinitionTiny,
  IndicateurSourceMetadonnee,
  IndicateurValeur,
  IndicateurValeurAvecMetadonnesDefinition,
} from '@tet/domain/indicateurs';
import { cloneDeep } from 'es-toolkit';
import { vi } from 'vitest';
import CollectivitesService from '../../collectivites/services/collectivites.service';
import { IndicateurDefinitionLockRepository } from '../definitions/indicateur-definition-lock.repository';
import { ListCollectiviteDefinitionsRepository } from '../definitions/list-collectivite-definitions/list-collectivite-definitions.repository';
import { ListPlatformDefinitionsRepository } from '../definitions/list-platform-definitions/list-platform-definitions.repository';
import { UpdateDefinitionService } from '../definitions/mutate-definition/update-definition.service';
import { ListIndicateursService } from '../indicateurs/list-indicateurs/list-indicateurs.service';
import IndicateurSourcesService from '../sources/indicateur-sources.service';
import { CrudValeursRepository } from './crud-valeurs.repository';
import CrudValeursService from './crud-valeurs.service';
import { IndicateurValeurLockRepository } from './indicateur-valeur-lock.repository';
import IndicateurExpressionService from './indicateur-expression.service';
import { indicateur1, indicateur2, indicateur3 } from './tests/fixture';
import { ListIndicateurValeursService } from './list-indicateur-valeurs.service';
import { ValidateIndicateurValeursWriteService } from './validate-indicateur-valeurs-write.service';
import { WriteIndicateurValeursService } from './write-indicateur-valeurs.service';
import { ReconcileIndicateurValeursService } from './reconcile-indicateur-valeurs.service';

// Compose the real workflows around repository mocks so these tests continue to
// exercise authorization, persistence and propagation together after extraction.
const createCrudValeursService = (
  repository: CrudValeursRepository,
  permissions: PermissionService,
  userPermissions: GetUserRolesAndPermissionsService,
  collectivites: CollectivitesService,
  definitions: ListCollectiviteDefinitionsRepository,
  platformDefinitions: ListPlatformDefinitionsRepository,
  indicateurs: ListIndicateursService,
  updateDefinition: UpdateDefinitionService,
  compute: ComputeValeursService,
  locks: IndicateurValeurLockRepository,
  definitionLocks: IndicateurDefinitionLockRepository,
  transactions: TransactionManager
) => {
  const validation = new ValidateIndicateurValeursWriteService(
    repository,
    permissions,
    definitions,
    definitionLocks
  );
  const writer = new WriteIndicateurValeursService(
    repository,
    validation,
    definitionLocks,
    locks
  );
  const reader = new ListIndicateurValeursService(
    repository,
    permissions,
    collectivites,
    definitions
  );
  const reconciliation = new ReconcileIndicateurValeursService(
    repository,
    compute,
    validation,
    writer,
    platformDefinitions,
    transactions
  );
  return new CrudValeursService(
    repository,
    permissions,
    userPermissions,
    indicateurs,
    updateDefinition,
    locks,
    definitionLocks,
    transactions,
    reader,
    writer,
    reconciliation
  );
};

const createTransactionManager = <TTransaction>(tx: TTransaction) => ({
  executeSingle: vi.fn(
    (
      operation: (transaction: TTransaction) => unknown,
      existingTx?: TTransaction
    ) => operation(existingTx ?? tx)
  ),
});

describe('Indicateurs → crud-valeurs.service', () => {
  let indicateurService: CrudValeursService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CrudValeursService],
    })
      .useMocker((token) => {
        if (
          token === CrudValeursRepository ||
          token === PermissionService ||
          token === CollectivitesService ||
          token === ListCollectiviteDefinitionsRepository ||
          token === ListPlatformDefinitionsRepository ||
          token === ListIndicateursService ||
          token === IndicateurExpressionService ||
          token === UpdateDefinitionService ||
          token === IndicateurSourcesService ||
          token === ComputeValeursService ||
          token === IndicateurValeurLockRepository ||
          token === IndicateurDefinitionLockRepository ||
          token === TransactionManager ||
          token === GetUserRolesAndPermissionsService ||
          token === ListIndicateurValeursService ||
          token === WriteIndicateurValeursService ||
          token === ReconcileIndicateurValeursService
        ) {
          return {};
        }
      })
      .compile();

    indicateurService = moduleRef.get(CrudValeursService);
  });

  describe('listIndicateurValeurs', () => {
    it('limite les définitions retournées à la collectivité demandée', async () => {
      const repository = {
        listIndicateurValeurs: vi.fn().mockResolvedValue([]),
        listSources: vi.fn().mockResolvedValue([]),
      };
      const definitionsRepository = {
        listCollectiviteDefinitions: vi.fn().mockResolvedValue([]),
      };
      const service = createCrudValeursService(
        repository as never,
        {} as never,
        {} as never,
        {} as never,
        definitionsRepository as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never
      );

      await expect(
        service.listIndicateurValeurs(
          { collectiviteId: 3, indicateurIds: [10] },
          { isUserTrusted: true }
        )
      ).resolves.toEqual({ count: 0, indicateurs: [] });

      expect(
        definitionsRepository.listCollectiviteDefinitions
      ).toHaveBeenCalledWith({
        collectiviteId: 3,
        indicateurIds: [10],
        identifiantsReferentiel: undefined,
      });
    });
  });

  describe('groupeIndicateursValeursParIndicateur', () => {
    it('Groupe les valeurs par indicateur, trie par date croissante les valeurs', async () => {
      const indicateurDefinitions: IndicateurDefinitionTiny[] = [
        indicateur1,
        indicateur2,
        indicateur3,
        indicateur1, // duplicate
      ];

      const indicateurValeurs: IndicateurValeur[] = [
        {
          id: 10264,
          collectiviteId: 4936,
          indicateurId: 456,
          periodicite: 'annuelle',
          dateValeur: '2016-01-01',
          metadonneeId: 1,
          resultat: null,
          resultatCommentaire: null,
          objectif: 527.25,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: '2024-08-14T14:10:18.891Z',
          createdAt: '2024-08-14T14:10:18.891Z',
          modifiedBy: null,
          createdBy: null,
          calculAuto: false,
          calculAutoIdentifiantsManquants: null,
        },
        {
          id: 10263,
          collectiviteId: 4936,
          indicateurId: 456,
          periodicite: 'annuelle',
          dateValeur: '2015-01-01',
          metadonneeId: 1,
          resultat: null,
          resultatCommentaire: null,
          objectif: 513.79,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: '2024-08-14T14:10:18.891Z',
          createdAt: '2024-08-14T14:10:18.891Z',
          modifiedBy: null,
          createdBy: null,
          calculAuto: false,
          calculAutoIdentifiantsManquants: null,
        },
        {
          id: 10300,
          collectiviteId: 4936,
          indicateurId: 457,
          periodicite: 'annuelle',
          dateValeur: '2016-01-01',
          metadonneeId: 1,
          resultat: null,
          resultatCommentaire: null,
          objectif: 423.08,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: '2024-08-14T14:10:18.891Z',
          createdAt: '2024-08-14T14:10:18.891Z',
          modifiedBy: null,
          createdBy: null,
          calculAuto: false,
          calculAutoIdentifiantsManquants: null,
        },
      ];
      const indicateurValeursGroupees =
        indicateurService.groupeIndicateursValeursParIndicateur(
          indicateurValeurs,
          indicateurDefinitions
        );
      const expectedIndicateurValeursGroupees: IndicateurAvecValeurs[] = [
        {
          definition: {
            id: 456,
            identifiantReferentiel: 'cae_1.c',
            titre: 'Emissions de gaz à effet de serre - résidentiel',
            titreLong:
              'Emissions de gaz à effet de serre du secteur résidentiel',
            description: '',
            unite: 'teq CO2',
            periodicite: 'annuelle',
            periodiciteMode: 'recommandee',
            borneMin: null,
            borneMax: null,
          },
          valeurs: [
            {
              periodicite: 'annuelle',
              dateValeur: '2015-01-01',
              collectiviteId: 4936,
              id: 10263,
              objectif: 513.79,
            },
            {
              periodicite: 'annuelle',
              dateValeur: '2016-01-01',
              collectiviteId: 4936,
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
            periodicite: 'annuelle',
            periodiciteMode: 'recommandee',
            borneMin: null,
            borneMax: null,
          },
          valeurs: [
            {
              collectiviteId: 4936,
              periodicite: 'annuelle',
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
      const indicateurDefinitions: IndicateurDefinitionTiny[] = [
        indicateur1,
        indicateur2,
        indicateur3,
        indicateur1, // duplicate
      ];

      const indicateurMetadonnees: IndicateurSourceMetadonnee[] = [
        {
          id: 2,
          sourceId: 'rare',
          dateVersion: '2024-07-18T00:00:00.000Z',
          nomDonnees: '',
          diffuseur: 'OREC',
          producteur: '',
          methodologie: 'Scope 1&2 (approche cadastrale)',
          limites: '',
        },
        {
          id: 3,
          sourceId: 'snbc',
          dateVersion: '2024-07-11T00:00:00.000Z',
          nomDonnees: null,
          diffuseur: null,
          producteur: null,
          methodologie: null,
          limites: null,
        },
      ];

      const indicateurValeurs: IndicateurValeur[] = [
        {
          id: 10264,
          collectiviteId: 4936,
          indicateurId: 456,
          periodicite: 'annuelle',
          dateValeur: '2016-01-01',
          metadonneeId: 2,
          resultat: null,
          resultatCommentaire: null,
          objectif: 527.25,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: '2024-08-14T14:10:18.891Z',
          createdAt: '2024-08-14T14:10:18.891Z',
          modifiedBy: null,
          createdBy: null,
          calculAuto: false,
          calculAutoIdentifiantsManquants: null,
        },
        {
          id: 10263,
          collectiviteId: 4936,
          indicateurId: 456,
          periodicite: 'annuelle',
          dateValeur: '2015-01-01',
          metadonneeId: 2,
          resultat: null,
          resultatCommentaire: null,
          objectif: 513.79,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: '2024-08-14T14:10:18.891Z',
          createdAt: '2024-08-14T14:10:18.891Z',
          modifiedBy: null,
          createdBy: null,
          calculAuto: false,
          calculAutoIdentifiantsManquants: null,
        },
        {
          id: 10264,
          collectiviteId: 4936,
          indicateurId: 456,
          periodicite: 'annuelle',
          dateValeur: '2015-01-01',
          metadonneeId: null,
          resultat: 625,
          resultatCommentaire: null,
          objectif: null,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: '2024-08-14T14:10:18.891Z',
          createdAt: '2024-08-14T14:10:18.891Z',
          modifiedBy: null,
          createdBy: null,
          calculAuto: false,
          calculAutoIdentifiantsManquants: null,
        },
        {
          id: 10300,
          collectiviteId: 4936,
          indicateurId: 457,
          periodicite: 'annuelle',
          dateValeur: '2016-01-01',
          metadonneeId: 3,
          resultat: null,
          resultatCommentaire: null,
          objectif: 423.08,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: '2024-08-14T14:10:18.891Z',
          createdAt: '2024-08-14T14:10:18.891Z',
          modifiedBy: null,
          createdBy: null,
          calculAuto: false,
          calculAutoIdentifiantsManquants: null,
        },
        {
          id: 10264,
          collectiviteId: 4936,
          indicateurId: 456,
          periodicite: 'annuelle',
          dateValeur: '2010-01-01',
          metadonneeId: null,
          resultat: null,
          resultatCommentaire: null,
          objectif: null,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: '2020-08-14T14:10:18.891Z',
          createdAt: '2020-08-14T14:10:18.891Z',
          modifiedBy: null,
          createdBy: null,
          calculAuto: false,
          calculAutoIdentifiantsManquants: null,
        },
      ];
      const indicateurValeursGroupees =
        indicateurService.groupeIndicateursValeursParIndicateurEtSource(
          indicateurValeurs,
          indicateurDefinitions,
          indicateurMetadonnees,
          [
            { id: 'rare', libelle: 'RARE-OREC', ordreAffichage: 1 },
            { id: 'snbc', libelle: 'SNBC', ordreAffichage: null },
          ]
        );
      const expectedIndicateurValeursGroupees: IndicateurAvecValeursParSource[] =
        [
          {
            definition: {
              id: 456,
              identifiantReferentiel: 'cae_1.c',
              titre: 'Emissions de gaz à effet de serre - résidentiel',
              titreLong:
                'Emissions de gaz à effet de serre du secteur résidentiel',
              description: '',
              unite: 'teq CO2',
              periodicite: 'annuelle',
              periodiciteMode: 'recommandee',
              borneMin: null,
              borneMax: null,
            } as IndicateurDefinition,
            totalValeursCount: 4,
            totalFilledValeursCount: 3,
            sources: {
              rare: {
                source: 'rare',
                libelle: 'RARE-OREC',
                ordreAffichage: 1,
                metadonnees: [
                  {
                    id: 2,
                    sourceId: 'rare',
                    dateVersion: '2024-07-18T00:00:00.000Z',
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
                    periodicite: 'annuelle',
                    dateValeur: '2015-01-01',
                    objectif: 513.79,
                    collectiviteId: 4936,
                    metadonneeId: 2,
                  },
                  {
                    id: 10264,
                    periodicite: 'annuelle',
                    dateValeur: '2016-01-01',
                    objectif: 527.25,
                    collectiviteId: 4936,
                    metadonneeId: 2,
                  },
                ],
              },
              collectivite: {
                source: 'collectivite',
                libelle: '',
                ordreAffichage: null,
                metadonnees: [],
                valeurs: [
                  {
                    id: 10264,
                    periodicite: 'annuelle',
                    dateValeur: '2010-01-01',
                    collectiviteId: 4936,
                  },
                  {
                    id: 10264,
                    periodicite: 'annuelle',
                    dateValeur: '2015-01-01',
                    resultat: 625,
                    collectiviteId: 4936,
                  },
                ],
              },
            },
          },
          {
            definition: {
              id: 457,
              identifiantReferentiel: 'cae_1.d',
              titre: 'Emissions de gaz à effet de serre - tertiaire',
              titreLong:
                'Emissions de gaz à effet de serre du secteur tertiaire',
              description: '',
              unite: 'teq CO2',
              periodicite: 'annuelle',
              periodiciteMode: 'recommandee',
              borneMin: null,
              borneMax: null,
            } as IndicateurDefinition,
            totalValeursCount: 1,
            totalFilledValeursCount: 1,
            sources: {
              snbc: {
                source: 'snbc',
                libelle: 'SNBC',
                ordreAffichage: null,
                metadonnees: [
                  {
                    dateVersion: '2024-07-11T00:00:00.000Z',
                    diffuseur: null,
                    id: 3,
                    limites: null,
                    methodologie: null,
                    nomDonnees: null,
                    producteur: null,
                    sourceId: 'snbc',
                  },
                ],
                valeurs: [
                  {
                    id: 10300,
                    periodicite: 'annuelle',
                    dateValeur: '2016-01-01',
                    objectif: 423.08,
                    collectiviteId: 4936,
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
          indicateurValeur: {
            id: 17,
            collectiviteId: 4936,
            indicateurId: 4,
            periodicite: 'annuelle',
            dateValeur: '2015-01-01',
            metadonneeId: 1,
            resultat: 447868,
            resultatCommentaire: null,
            objectif: null,
            objectifCommentaire: null,
            estimation: null,
            modifiedAt: '2024-08-27T11:55:09.325Z',
            createdAt: '2024-08-27T11:55:09.325Z',
            modifiedBy: null,
            createdBy: null,
            calculAuto: false,
            calculAutoIdentifiantsManquants: null,
          },
          indicateurDefinition: {
            id: 4,
            groupementId: null,
            collectiviteId: null,
            identifiantReferentiel: 'cae_1.c',
            titre: 'Emissions de gaz à effet de serre - résidentiel',
            titreLong:
              'Emissions de gaz à effet de serre du secteur résidentiel',
            description: '',
            unite: 'teq CO2',
            periodicite: 'annuelle',
            periodiciteMode: 'recommandee',
            borneMin: null,
            borneMax: null,
            participationScore: false,
            sansValeurUtilisateur: false,
            valeurCalcule: null,
            modifiedAt: '2024-08-27T11:54:51.791Z',
            createdAt: '2024-08-27T11:54:51.791Z',
            modifiedBy: null,
            createdBy: null,
            version: '1.0.0',
            precision: 2,
            titreCourt: null,
            exprCible: null,
            exprSeuil: null,
            libelleCibleSeuil: null,
          },
          indicateurSourceMetadonnee: {
            id: 1,
            sourceId: 'rare',
            dateVersion: '2024-07-18T00:00:00.000Z',
            nomDonnees: '',
            diffuseur: 'OREC',
            producteur: '',
            methodologie: 'Scope 1&2 (approche cadastrale)',
            limites: '',
          },
        },
        {
          indicateurValeur: {
            id: 875,
            collectiviteId: 4936,
            indicateurId: 4,
            periodicite: 'annuelle',
            dateValeur: '2015-01-01',
            metadonneeId: 2,
            resultat: null,
            resultatCommentaire: null,
            objectif: 513790,
            objectifCommentaire: null,
            estimation: null,
            modifiedAt: '2024-08-27T11:57:28.686Z',
            createdAt: '2024-08-27T11:57:28.686Z',
            modifiedBy: null,
            createdBy: null,
            calculAuto: false,
            calculAutoIdentifiantsManquants: null,
          },
          indicateurDefinition: {
            id: 4,
            groupementId: null,
            collectiviteId: null,
            identifiantReferentiel: 'cae_1.c',
            titre: 'Emissions de gaz à effet de serre - résidentiel',
            titreLong:
              'Emissions de gaz à effet de serre du secteur résidentiel',
            description: '',
            unite: 'teq CO2',
            periodicite: 'annuelle',
            periodiciteMode: 'recommandee',
            borneMin: null,
            borneMax: null,
            participationScore: false,
            sansValeurUtilisateur: false,
            valeurCalcule: null,
            modifiedAt: '2024-08-27T11:54:51.791Z',
            createdAt: '2024-08-27T11:54:51.791Z',
            modifiedBy: null,
            createdBy: null,
            version: '1.0.0',
            precision: 2,
            titreCourt: null,
            exprCible: null,
            exprSeuil: null,
            libelleCibleSeuil: null,
          },
          indicateurSourceMetadonnee: {
            id: 2,
            sourceId: 'snbc',
            dateVersion: '2024-07-11T00:00:00.000Z',
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
        cloneDeep(indicateurValeurs);

      expect(indicateurValeursDedoublonnees).toEqual(
        indicateurValeursDedoublonneesAttendues
      );
    });

    it('Même collectivite, Même source, Même date mais deux indicateurs différentes > pas de dédoublonnage', async () => {
      const indicateurValeurs: IndicateurValeurAvecMetadonnesDefinition[] = [
        {
          indicateurValeur: {
            id: 17,
            collectiviteId: 4936,
            indicateurId: 4,
            periodicite: 'annuelle',
            dateValeur: '2015-01-01',
            metadonneeId: 1,
            resultat: 447868,
            resultatCommentaire: null,
            objectif: null,
            objectifCommentaire: null,
            estimation: null,
            modifiedAt: '2024-08-27T11:55:09.325Z',
            createdAt: '2024-08-27T11:55:09.325Z',
            modifiedBy: null,
            createdBy: null,
            calculAuto: false,
            calculAutoIdentifiantsManquants: null,
          },
          indicateurDefinition: {
            id: 4,
            groupementId: null,
            collectiviteId: null,
            identifiantReferentiel: 'cae_1.c',
            titre: 'Emissions de gaz à effet de serre - résidentiel',
            titreLong:
              'Emissions de gaz à effet de serre du secteur résidentiel',
            description: '',
            unite: 'teq CO2',
            periodicite: 'annuelle',
            periodiciteMode: 'recommandee',
            borneMin: null,
            borneMax: null,
            participationScore: false,
            sansValeurUtilisateur: false,
            valeurCalcule: null,
            modifiedAt: '2024-08-27T11:54:51.791Z',
            createdAt: '2024-08-27T11:54:51.791Z',
            modifiedBy: null,
            createdBy: null,
            version: '1.0.0',
            precision: 2,
            titreCourt: null,
            exprCible: null,
            exprSeuil: null,
            libelleCibleSeuil: null,
          },
          indicateurSourceMetadonnee: {
            id: 1,
            sourceId: 'rare',
            dateVersion: '2024-07-18T00:00:00.000Z',
            nomDonnees: '',
            diffuseur: 'OREC',
            producteur: '',
            methodologie: 'Scope 1&2 (approche cadastrale)',
            limites: '',
          },
        },
        {
          indicateurValeur: {
            id: 18,
            collectiviteId: 4936,
            indicateurId: 9,
            periodicite: 'annuelle',
            dateValeur: '2015-01-01',
            metadonneeId: 1,
            resultat: 471107,
            resultatCommentaire: null,
            objectif: null,
            objectifCommentaire: null,
            estimation: null,
            modifiedAt: '2024-08-27T11:55:09.325Z',
            createdAt: '2024-08-27T11:55:09.325Z',
            modifiedBy: null,
            createdBy: null,
            calculAuto: false,
            calculAutoIdentifiantsManquants: null,
          },
          indicateurDefinition: {
            id: 9,
            groupementId: null,
            collectiviteId: null,
            identifiantReferentiel: 'cae_1.d',
            titre: 'Emissions de gaz à effet de serre - tertiaire',
            titreLong: 'Emissions de gaz à effet de serre du secteur tertiaire',
            description: '',
            unite: 'teq CO2',
            periodicite: 'annuelle',
            periodiciteMode: 'recommandee',
            borneMin: null,
            borneMax: null,
            participationScore: false,
            sansValeurUtilisateur: false,
            valeurCalcule: null,
            modifiedAt: '2024-08-27T11:54:51.791Z',
            createdAt: '2024-08-27T11:54:51.791Z',
            modifiedBy: null,
            createdBy: null,
            version: '1.0.0',
            precision: 2,
            titreCourt: null,
            exprCible: null,
            exprSeuil: null,
            libelleCibleSeuil: null,
          },
          indicateurSourceMetadonnee: {
            id: 1,
            sourceId: 'rare',
            dateVersion: '2024-07-18T00:00:00.000Z',
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
        cloneDeep(indicateurValeurs);

      expect(indicateurValeursDedoublonnees).toEqual(
        indicateurValeursDedoublonneesAttendues
      );
    });

    it('Même collectivite, Même date, Même indicateur mais une source et une donnée utilisateur > pas de dédoublonnage', async () => {
      const indicateurValeurs: IndicateurValeurAvecMetadonnesDefinition[] = [
        {
          indicateurValeur: {
            id: 17,
            collectiviteId: 4936,
            indicateurId: 4,
            periodicite: 'annuelle',
            dateValeur: '2015-01-01',
            metadonneeId: 1,
            resultat: 447868,
            resultatCommentaire: null,
            objectif: null,
            objectifCommentaire: null,
            estimation: null,
            modifiedAt: '2024-08-27T11:55:09.325Z',
            createdAt: '2024-08-27T11:55:09.325Z',
            modifiedBy: null,
            createdBy: null,
            calculAuto: false,
            calculAutoIdentifiantsManquants: null,
          },
          indicateurDefinition: {
            id: 4,
            groupementId: null,
            collectiviteId: null,
            identifiantReferentiel: 'cae_1.c',
            titre: 'Emissions de gaz à effet de serre - résidentiel',
            titreLong:
              'Emissions de gaz à effet de serre du secteur résidentiel',
            description: '',
            unite: 'teq CO2',
            periodicite: 'annuelle',
            periodiciteMode: 'recommandee',
            borneMin: null,
            borneMax: null,
            participationScore: false,
            sansValeurUtilisateur: false,
            valeurCalcule: null,
            modifiedAt: '2024-08-27T11:54:51.791Z',
            createdAt: '2024-08-27T11:54:51.791Z',
            modifiedBy: null,
            createdBy: null,
            version: '1.0.0',
            precision: 2,
            titreCourt: null,
            exprCible: null,
            exprSeuil: null,
            libelleCibleSeuil: null,
          },
          indicateurSourceMetadonnee: {
            id: 1,
            sourceId: 'rare',
            dateVersion: '2024-07-18T00:00:00.000Z',
            nomDonnees: '',
            diffuseur: 'OREC',
            producteur: '',
            methodologie: 'Scope 1&2 (approche cadastrale)',
            limites: '',
          },
        },
        {
          indicateurValeur: {
            id: 875,
            collectiviteId: 4936,
            indicateurId: 4,
            periodicite: 'annuelle',
            dateValeur: '2015-01-01',
            metadonneeId: null,
            resultat: null,
            resultatCommentaire: null,
            objectif: 513790,
            objectifCommentaire: null,
            estimation: null,
            modifiedAt: '2024-08-27T11:57:28.686Z',
            createdAt: '2024-08-27T11:57:28.686Z',
            modifiedBy: null,
            createdBy: null,
            calculAuto: false,
            calculAutoIdentifiantsManquants: null,
          },
          indicateurDefinition: {
            id: 4,
            groupementId: null,
            collectiviteId: null,
            identifiantReferentiel: 'cae_1.c',
            titre: 'Emissions de gaz à effet de serre - résidentiel',
            titreLong:
              'Emissions de gaz à effet de serre du secteur résidentiel',
            description: '',
            unite: 'teq CO2',
            periodicite: 'annuelle',
            periodiciteMode: 'recommandee',
            borneMin: null,
            borneMax: null,
            participationScore: false,
            sansValeurUtilisateur: false,
            valeurCalcule: null,
            modifiedAt: '2024-08-27T11:54:51.791Z',
            createdAt: '2024-08-27T11:54:51.791Z',
            modifiedBy: null,
            createdBy: null,
            version: '1.0.0',
            precision: 2,
            titreCourt: null,
            exprCible: null,
            exprSeuil: null,
            libelleCibleSeuil: null,
          },
          indicateurSourceMetadonnee: null,
        },
      ];
      const indicateurValeursDedoublonnees =
        indicateurService.dedoublonnageIndicateurValeursParSource(
          indicateurValeurs
        );

      // Même date mais deux sources différentes, on ne doit pas dédoublonner
      const indicateurValeursDedoublonneesAttendues: IndicateurValeurAvecMetadonnesDefinition[] =
        cloneDeep(indicateurValeurs);

      expect(indicateurValeursDedoublonnees).toEqual(
        indicateurValeursDedoublonneesAttendues
      );
    });

    it('Même indicateur, Même source, Même date mais deux collectivités différentes > pas de dédoublonnage', async () => {
      const indicateurValeurs: IndicateurValeurAvecMetadonnesDefinition[] = [
        {
          indicateurValeur: {
            id: 17,
            collectiviteId: 4936,
            indicateurId: 4,
            periodicite: 'annuelle',
            dateValeur: '2015-01-01',
            metadonneeId: 1,
            resultat: 447868,
            resultatCommentaire: null,
            objectif: null,
            objectifCommentaire: null,
            estimation: null,
            modifiedAt: '2024-08-27T11:55:09.325Z',
            createdAt: '2024-08-27T11:55:09.325Z',
            modifiedBy: null,
            createdBy: null,
            calculAuto: false,
            calculAutoIdentifiantsManquants: null,
          },
          indicateurDefinition: {
            id: 4,
            groupementId: null,
            collectiviteId: null,
            identifiantReferentiel: 'cae_1.c',
            titre: 'Emissions de gaz à effet de serre - résidentiel',
            titreLong:
              'Emissions de gaz à effet de serre du secteur résidentiel',
            description: '',
            unite: 'teq CO2',
            periodicite: 'annuelle',
            periodiciteMode: 'recommandee',
            borneMin: null,
            borneMax: null,
            participationScore: false,
            sansValeurUtilisateur: false,
            valeurCalcule: null,
            modifiedAt: '2024-08-27T11:54:51.791Z',
            createdAt: '2024-08-27T11:54:51.791Z',
            modifiedBy: null,
            createdBy: null,
            version: '1.0.0',
            precision: 2,
            titreCourt: null,
            exprCible: null,
            exprSeuil: null,
            libelleCibleSeuil: null,
          },
          indicateurSourceMetadonnee: {
            id: 1,
            sourceId: 'rare',
            dateVersion: '2024-07-18T00:00:00.000Z',
            nomDonnees: '',
            diffuseur: 'OREC',
            producteur: '',
            methodologie: 'Scope 1&2 (approche cadastrale)',
            limites: '',
          },
        },
        {
          indicateurValeur: {
            id: 875,
            collectiviteId: 2012,
            indicateurId: 4,
            periodicite: 'annuelle',
            dateValeur: '2015-01-01',
            metadonneeId: 1,
            resultat: null,
            resultatCommentaire: null,
            objectif: 513790,
            objectifCommentaire: null,
            estimation: null,
            modifiedAt: '2024-08-27T11:57:28.686Z',
            createdAt: '2024-08-27T11:57:28.686Z',
            modifiedBy: null,
            createdBy: null,
            calculAuto: false,
            calculAutoIdentifiantsManquants: null,
          },
          indicateurDefinition: {
            id: 4,
            groupementId: null,
            collectiviteId: null,
            identifiantReferentiel: 'cae_1.c',
            titre: 'Emissions de gaz à effet de serre - résidentiel',
            titreLong:
              'Emissions de gaz à effet de serre du secteur résidentiel',
            description: '',
            unite: 'teq CO2',
            periodicite: 'annuelle',
            periodiciteMode: 'recommandee',
            borneMin: null,
            borneMax: null,
            participationScore: false,
            sansValeurUtilisateur: false,
            valeurCalcule: null,
            modifiedAt: '2024-08-27T11:54:51.791Z',
            createdAt: '2024-08-27T11:54:51.791Z',
            modifiedBy: null,
            createdBy: null,
            version: '1.0.0',
            precision: 2,
            titreCourt: null,
            exprCible: null,
            exprSeuil: null,
            libelleCibleSeuil: null,
          },
          indicateurSourceMetadonnee: {
            id: 1,
            sourceId: 'rare',
            dateVersion: '2024-07-18T00:00:00.000Z',
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
        cloneDeep(indicateurValeurs);

      expect(indicateurValeursDedoublonnees).toEqual(
        indicateurValeursDedoublonneesAttendues
      );
    });

    it('Même collectivite, Même indicateur, Même source mais deux dates différentes > pas de dédoublonnage', async () => {
      const indicateurValeurs: IndicateurValeurAvecMetadonnesDefinition[] = [
        {
          indicateurValeur: {
            id: 17,
            collectiviteId: 4936,
            indicateurId: 4,
            periodicite: 'annuelle',
            dateValeur: '2015-01-01',
            metadonneeId: 1,
            resultat: 447868,
            resultatCommentaire: null,
            objectif: null,
            objectifCommentaire: null,
            estimation: null,
            modifiedAt: '2024-08-27T11:55:09.325Z',
            createdAt: '2024-08-27T11:55:09.325Z',
            modifiedBy: null,
            createdBy: null,
            calculAuto: false,
            calculAutoIdentifiantsManquants: null,
          },
          indicateurDefinition: {
            id: 4,
            groupementId: null,
            collectiviteId: null,
            identifiantReferentiel: 'cae_1.c',
            titre: 'Emissions de gaz à effet de serre - résidentiel',
            titreLong:
              'Emissions de gaz à effet de serre du secteur résidentiel',
            description: '',
            unite: 'teq CO2',
            periodicite: 'annuelle',
            periodiciteMode: 'recommandee',
            borneMin: null,
            borneMax: null,
            participationScore: false,
            sansValeurUtilisateur: false,
            valeurCalcule: null,
            modifiedAt: '2024-08-27T11:54:51.791Z',
            createdAt: '2024-08-27T11:54:51.791Z',
            modifiedBy: null,
            createdBy: null,
            version: '1.0.0',
            precision: 2,
            titreCourt: null,
            exprCible: null,
            exprSeuil: null,
            libelleCibleSeuil: null,
          },
          indicateurSourceMetadonnee: {
            id: 1,
            sourceId: 'rare',
            dateVersion: '2024-07-18T00:00:00.000Z',
            nomDonnees: '',
            diffuseur: 'OREC',
            producteur: '',
            methodologie: 'Scope 1&2 (approche cadastrale)',
            limites: '',
          },
        },
        {
          indicateurValeur: {
            id: 875,
            collectiviteId: 4936,
            indicateurId: 4,
            periodicite: 'annuelle',
            dateValeur: '2014-01-01',
            metadonneeId: 1,
            resultat: null,
            resultatCommentaire: null,
            objectif: 513790,
            objectifCommentaire: null,
            estimation: null,
            modifiedAt: '2024-08-27T11:57:28.686Z',
            createdAt: '2024-08-27T11:57:28.686Z',
            modifiedBy: null,
            createdBy: null,
            calculAuto: false,
            calculAutoIdentifiantsManquants: null,
          },
          indicateurDefinition: {
            id: 4,
            groupementId: null,
            collectiviteId: null,
            identifiantReferentiel: 'cae_1.c',
            titre: 'Emissions de gaz à effet de serre - résidentiel',
            titreLong:
              'Emissions de gaz à effet de serre du secteur résidentiel',
            description: '',
            unite: 'teq CO2',
            periodicite: 'annuelle',
            periodiciteMode: 'recommandee',
            borneMin: null,
            borneMax: null,
            participationScore: false,
            sansValeurUtilisateur: false,
            valeurCalcule: null,
            modifiedAt: '2024-08-27T11:54:51.791Z',
            createdAt: '2024-08-27T11:54:51.791Z',
            modifiedBy: null,
            createdBy: null,
            version: '1.0.0',
            precision: 2,
            titreCourt: null,
            exprCible: null,
            exprSeuil: null,
            libelleCibleSeuil: null,
          },
          indicateurSourceMetadonnee: {
            id: 1,
            sourceId: 'rare',
            dateVersion: '2024-07-18T00:00:00.000Z',
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
        cloneDeep(indicateurValeurs);

      expect(indicateurValeursDedoublonnees).toEqual(
        indicateurValeursDedoublonneesAttendues
      );
    });

    it('Même source, même date et métadonnées différentes, on prend la plus récente', async () => {
      const indicateurValeur1: IndicateurValeurAvecMetadonnesDefinition = {
        indicateurValeur: {
          id: 17,
          collectiviteId: 4936,
          indicateurId: 4,
          periodicite: 'annuelle',
          dateValeur: '2015-01-01',
          metadonneeId: 1,
          resultat: 447868,
          resultatCommentaire: null,
          objectif: null,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: '2024-08-27T11:55:09.325Z',
          createdAt: '2024-08-27T11:55:09.325Z',
          modifiedBy: null,
          createdBy: null,
          calculAuto: false,
          calculAutoIdentifiantsManquants: null,
        },
        indicateurDefinition: {
          id: 4,
          groupementId: null,
          collectiviteId: null,
          identifiantReferentiel: 'cae_1.c',
          titre: 'Emissions de gaz à effet de serre - résidentiel',
          titreLong: 'Emissions de gaz à effet de serre du secteur résidentiel',
          description: '',
          unite: 'teq CO2',
          periodicite: 'annuelle',
          periodiciteMode: 'recommandee',
          borneMin: null,
          borneMax: null,
          participationScore: false,
          sansValeurUtilisateur: false,
          valeurCalcule: null,
          modifiedAt: '2024-08-27T11:54:51.791Z',
          createdAt: '2024-08-27T11:54:51.791Z',
          modifiedBy: null,
          createdBy: null,
          version: '1.0.0',
          precision: 2,
          titreCourt: null,
          exprCible: null,
          exprSeuil: null,
          libelleCibleSeuil: null,
        },
        indicateurSourceMetadonnee: {
          id: 1,
          sourceId: 'rare',
          dateVersion: '2024-07-18T00:00:00.000Z',
          nomDonnees: '',
          diffuseur: 'OREC',
          producteur: '',
          methodologie: 'Scope 1&2 (approche cadastrale)',
          limites: '',
        },
      };
      const indicateurValeur2: IndicateurValeurAvecMetadonnesDefinition = {
        indicateurValeur: {
          id: 875,
          collectiviteId: 4936,
          indicateurId: 4,
          periodicite: 'annuelle',
          dateValeur: '2015-01-01',
          metadonneeId: 2,
          resultat: null,
          resultatCommentaire: null,
          objectif: 513790,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: '2024-08-27T11:57:28.686Z',
          createdAt: '2024-08-27T11:57:28.686Z',
          modifiedBy: null,
          createdBy: null,
          calculAuto: false,
          calculAutoIdentifiantsManquants: null,
        },
        indicateurDefinition: {
          id: 4,
          groupementId: null,
          collectiviteId: null,
          identifiantReferentiel: 'cae_1.c',
          titre: 'Emissions de gaz à effet de serre - résidentiel',
          titreLong: 'Emissions de gaz à effet de serre du secteur résidentiel',
          description: '',
          unite: 'teq CO2',
          periodicite: 'annuelle',
          periodiciteMode: 'recommandee',
          borneMin: null,
          borneMax: null,
          participationScore: false,
          sansValeurUtilisateur: false,
          valeurCalcule: null,
          modifiedAt: '2024-08-27T11:54:51.791Z',
          createdAt: '2024-08-27T11:54:51.791Z',
          modifiedBy: null,
          createdBy: null,
          version: '1.0.0',
          precision: 2,
          titreCourt: null,
          exprCible: null,
          exprSeuil: null,
          libelleCibleSeuil: null,
        },
        indicateurSourceMetadonnee: {
          id: 2,
          sourceId: 'rare',
          dateVersion: '2024-08-01T00:00:00.000Z',
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
        [cloneDeep(indicateurValeur2)];

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

      const sameVersionOlderMetadata = cloneDeep(indicateurValeur1);
      const sameVersionNewerMetadata = cloneDeep(indicateurValeur2);
      const olderMetadata = sameVersionOlderMetadata.indicateurSourceMetadonnee;
      const newerMetadata = sameVersionNewerMetadata.indicateurSourceMetadonnee;
      if (!olderMetadata || !newerMetadata) {
        throw new Error('Les métadonnées de test doivent être définies');
      }
      newerMetadata.dateVersion = olderMetadata.dateVersion;

      // Une date de version identique ne doit pas rendre le résultat dépendant
      // de l'ordre SQL : le plus grand identifiant de métadonnée gagne.
      expect(
        indicateurService.dedoublonnageIndicateurValeursParSource([
          sameVersionOlderMetadata,
          sameVersionNewerMetadata,
        ])
      ).toEqual([sameVersionNewerMetadata]);
      expect(
        indicateurService.dedoublonnageIndicateurValeursParSource([
          sameVersionNewerMetadata,
          sameVersionOlderMetadata,
        ])
      ).toEqual([sameVersionNewerMetadata]);
    });

    it("Doublon parfait, on en conserve qu'un", async () => {
      const indicateurValeur1: IndicateurValeurAvecMetadonnesDefinition = {
        indicateurValeur: {
          id: 17,
          collectiviteId: 4936,
          indicateurId: 4,
          periodicite: 'annuelle',
          dateValeur: '2015-01-01',
          metadonneeId: 1,
          resultat: 447868,
          resultatCommentaire: null,
          objectif: null,
          objectifCommentaire: null,
          estimation: null,
          modifiedAt: '2024-08-27T11:55:09.325Z',
          createdAt: '2024-08-27T11:55:09.325Z',
          modifiedBy: null,
          createdBy: null,
          calculAuto: false,
          calculAutoIdentifiantsManquants: null,
        },
        indicateurDefinition: {
          id: 4,
          groupementId: null,
          collectiviteId: null,
          identifiantReferentiel: 'cae_1.c',
          titre: 'Emissions de gaz à effet de serre - résidentiel',
          titreLong: 'Emissions de gaz à effet de serre du secteur résidentiel',
          description: '',
          unite: 'teq CO2',
          periodicite: 'annuelle',
          periodiciteMode: 'recommandee',
          borneMin: null,
          borneMax: null,
          participationScore: false,
          sansValeurUtilisateur: false,
          valeurCalcule: null,
          modifiedAt: '2024-08-27T11:54:51.791Z',
          createdAt: '2024-08-27T11:54:51.791Z',
          modifiedBy: null,
          createdBy: null,
          version: '1.0.0',
          precision: 2,
          titreCourt: null,
          exprCible: null,
          exprSeuil: null,
          libelleCibleSeuil: null,
        },
        indicateurSourceMetadonnee: {
          id: 1,
          sourceId: 'rare',
          dateVersion: '2024-07-18T00:00:00.000Z',
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
          cloneDeep(indicateurValeur1),
        ]);

      // On ne doit garder que la valeur la plus récente
      const indicateurValeursDedoublonneesAttendues: IndicateurValeurAvecMetadonnesDefinition[] =
        [cloneDeep(indicateurValeur1)];

      expect(indicateurValeursDedoublonnees).toEqual(
        indicateurValeursDedoublonneesAttendues
      );
    });
  });

  describe('upsertValeur', () => {
    it('refuse une périodicité modifiée avant le verrou de transaction', async () => {
      const tx = { insert: vi.fn(), update: vi.fn(), select: vi.fn() };
      const repository = {};
      const transactionManager = createTransactionManager(tx);
      const listIndicateursService = {
        getIndicateur: vi.fn().mockResolvedValue({
          id: 10,
          periodicite: 'annuelle',
          periodiciteMode: 'recommandee',
          precision: 2,
          sansValeurUtilisateur: false,
        }),
      };
      const definitionLockRepository = {
        lockDefinitions: vi.fn().mockResolvedValue([
          {
            id: 10,
            collectiviteId: null,
            identifiantReferentiel: null,
            periodicite: 'mensuelle',
            periodiciteMode: 'imposee',
            precision: 2,
            sansValeurUtilisateur: false,
          },
        ]),
      };
      const service = createCrudValeursService(
        repository as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        listIndicateursService as never,
        {} as never,
        {} as never,
        {} as never,
        definitionLockRepository as never,
        transactionManager as never
      );
      vi.spyOn(service, 'canMutateValeur').mockResolvedValue(true);

      await expect(
        service.upsertValeur(
          {
            collectiviteId: 3,
            indicateurId: 10,
            // Janvier est canonique pour les deux périodicités : seule la
            // comparaison de la définition verrouillée révèle la course.
            periodicite: 'annuelle',
            dateValeur: '2026-01-01',
            resultat: 42,
          },
          {
            id: '00000000-0000-0000-0000-000000000001',
            role: AuthRole.AUTHENTICATED,
          } as never
        )
      ).rejects.toThrow('La valeur doit respecter la périodicité imposée');

      expect(definitionLockRepository.lockDefinitions).toHaveBeenCalledWith(
        [10],
        tx
      );
      expect(tx.select).not.toHaveBeenCalled();
      expect(tx.insert).not.toHaveBeenCalled();
      expect(tx.update).not.toHaveBeenCalled();
    });
  });

  describe('upsertIndicateurValeurs', () => {
    it("autorise le service-role à écrire une valeur open-data d'un indicateur protégé", async () => {
      const saved = {
        id: 1,
        collectiviteId: 3,
        indicateurId: 10,
        periodicite: 'annuelle',
        dateValeur: '2026-01-01',
        metadonneeId: 1,
        resultat: 42,
        objectif: null,
        resultatCommentaire: null,
        objectifCommentaire: null,
        estimation: null,
        calculAuto: false,
        calculAutoIdentifiantsManquants: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        modifiedAt: '2026-01-01T00:00:00.000Z',
        createdBy: null,
        modifiedBy: null,
      } satisfies IndicateurValeur;
      const tx = {
        marker: 'transaction',
      };
      const transactionManager = createTransactionManager(tx);
      const repository = {
        upsertValeursWithMetadata: vi.fn().mockResolvedValue([saved]),
        listMetadataSources: vi
          .fn()
          .mockResolvedValue([{ id: 1, sourceId: 'rare' }]),
        lockGroupementMemberships: vi.fn(),
      };
      const permissionService = {
        assertAllowed: vi.fn().mockResolvedValue(undefined),
      };
      const definitionsRepository = {
        listCollectiviteDefinitions: vi.fn().mockResolvedValue([
          {
            id: 10,
            collectiviteId: null,
            groupementId: 99,
            identifiantReferentiel: null,
            periodicite: 'annuelle',
            periodiciteMode: 'recommandee',
            precision: 2,
            sansValeurUtilisateur: true,
          },
        ]),
      };
      const computeValeursService = {
        updateCalculatedIndicateurValeurs: vi.fn().mockResolvedValue([]),
      };
      const lockRepository = { lock: vi.fn().mockResolvedValue(undefined) };
      const definitionLockRepository = {
        lockDefinitions: vi.fn().mockResolvedValue([
          {
            id: 10,
            collectiviteId: null,
            groupementId: 99,
            identifiantReferentiel: null,
            periodicite: 'annuelle',
            periodiciteMode: 'recommandee',
            precision: 2,
            sansValeurUtilisateur: true,
          },
        ]),
      };
      const service = createCrudValeursService(
        repository as never,
        permissionService as never,
        {} as never,
        {} as never,
        definitionsRepository as never,
        {} as never,
        {} as never,
        {} as never,
        computeValeursService as never,
        lockRepository as never,
        definitionLockRepository as never,
        transactionManager as never
      );
      const serviceRoleUser = {
        id: null,
        role: AuthRole.SERVICE_ROLE,
        isAnonymous: true,
        jwtPayload: { role: AuthRole.SERVICE_ROLE },
      } satisfies ServiceRoleUser;

      await expect(
        service.upsertIndicateurValeurs(
          [
            {
              collectiviteId: 3,
              indicateurId: 10,
              periodicite: 'annuelle',
              dateValeur: '2026-01-01',
              metadonneeId: 1,
              resultat: 42,
            },
          ],
          { user: serviceRoleUser }
        )
      ).resolves.toEqual([
        { ...saved, sourceId: 'rare', indicateurIdentifiant: null },
      ]);

      expect(permissionService.assertAllowed).toHaveBeenCalledOnce();
      expect(definitionLockRepository.lockDefinitions).toHaveBeenCalledWith(
        [10],
        tx
      );
      expect(repository.upsertValeursWithMetadata).toHaveBeenCalledWith(
        [expect.objectContaining({ indicateurId: 10, metadonneeId: 1 })],
        tx
      );
      expect(repository.lockGroupementMemberships).not.toHaveBeenCalled();
    });

    it('donne la priorité au périmètre groupement pour une définition historique portant aussi une collectivité', async () => {
      const tx = { marker: 'transaction' };
      const definition = {
        id: 10,
        collectiviteId: 4,
        groupementId: 99,
        identifiantReferentiel: null,
        periodicite: 'annuelle',
        periodiciteMode: 'recommandee',
        precision: 2,
        sansValeurUtilisateur: false,
      };
      const repository = {
        lockGroupementMemberships: vi
          .fn()
          .mockResolvedValue([{ groupementId: 99, collectiviteId: 3 }]),
        upsertValeursWithoutMetadata: vi.fn().mockResolvedValue([]),
      };
      const permissionService = {
        assertAllowed: vi.fn().mockResolvedValue(undefined),
      };
      const definitionsRepository = {
        listCollectiviteDefinitions: vi.fn().mockResolvedValue([definition]),
      };
      const lockRepository = { lock: vi.fn().mockResolvedValue(undefined) };
      const definitionLockRepository = {
        lockDefinitions: vi.fn().mockResolvedValue([definition]),
      };
      const service = createCrudValeursService(
        repository as never,
        permissionService as never,
        {} as never,
        {} as never,
        definitionsRepository as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        lockRepository as never,
        definitionLockRepository as never,
        createTransactionManager(tx) as never
      );

      await expect(
        service.upsertIndicateurValeurs(
          [
            {
              collectiviteId: 3,
              indicateurId: 10,
              periodicite: 'annuelle',
              dateValeur: '2026-01-01',
              resultat: 42,
            },
          ],
          {
            user: {
              id: '00000000-0000-0000-0000-000000000001',
              role: AuthRole.AUTHENTICATED,
            } as never,
          }
        )
      ).resolves.toEqual([]);

      expect(repository.lockGroupementMemberships).toHaveBeenCalledWith(
        [{ groupementId: 99, collectiviteId: 3 }],
        tx
      );
      expect(repository.upsertValeursWithoutMetadata).toHaveBeenCalledOnce();
    });

    it("préserve la capacité interne explicite d'écrire un indicateur de groupement pour une non-membre", async () => {
      const tx = { marker: 'transaction' };
      const definition = {
        id: 10,
        collectiviteId: null,
        groupementId: 99,
        identifiantReferentiel: null,
        periodicite: 'annuelle',
        periodiciteMode: 'recommandee',
        precision: 2,
        sansValeurUtilisateur: false,
      };
      const repository = {
        lockGroupementMemberships: vi.fn(),
        upsertValeursWithoutMetadata: vi.fn().mockResolvedValue([]),
      };
      const definitionsRepository = {
        listCollectiviteDefinitions: vi.fn().mockResolvedValue([definition]),
      };
      const lockRepository = { lock: vi.fn().mockResolvedValue(undefined) };
      const definitionLockRepository = {
        lockDefinitions: vi.fn().mockResolvedValue([definition]),
      };
      const service = createCrudValeursService(
        repository as never,
        {} as never,
        {} as never,
        {} as never,
        definitionsRepository as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        lockRepository as never,
        definitionLockRepository as never,
        createTransactionManager(tx) as never
      );

      await expect(
        service.upsertIndicateurValeurs(
          [
            {
              collectiviteId: 3,
              indicateurId: 10,
              periodicite: 'annuelle',
              dateValeur: '2026-01-01',
              resultat: 42,
            },
          ],
          { isUserTrusted: true }
        )
      ).resolves.toEqual([]);

      expect(repository.lockGroupementMemberships).not.toHaveBeenCalled();
      expect(repository.upsertValeursWithoutMetadata).toHaveBeenCalledOnce();
    });

    it('refuse une périodicité modifiée avant le verrou de transaction', async () => {
      const tx = { insert: vi.fn() };
      const repository = {};
      const transactionManager = createTransactionManager(tx);
      const definitionLockRepository = {
        // Simule une définition passée d'annuelle à mensuelle juste avant le
        // début de la transaction d'écriture.
        lockDefinitions: vi.fn().mockResolvedValue([
          {
            id: 10,
            collectiviteId: null,
            identifiantReferentiel: null,
            periodicite: 'mensuelle',
            precision: 2,
            sansValeurUtilisateur: false,
          },
        ]),
      };
      const definitionsRepository = {
        listCollectiviteDefinitions: vi.fn().mockResolvedValue([
          {
            id: 10,
            identifiantReferentiel: null,
            periodicite: 'annuelle',
            periodiciteMode: 'recommandee',
            precision: 2,
            sansValeurUtilisateur: false,
          },
        ]),
      };
      const service = createCrudValeursService(
        repository as never,
        {} as never,
        {} as never,
        {} as never,
        definitionsRepository as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        definitionLockRepository as never,
        transactionManager as never
      );

      await expect(
        service.upsertIndicateurValeurs(
          [
            {
              collectiviteId: 3,
              indicateurId: 10,
              // Janvier est une date SQL canonique pour les deux périodicités :
              // seule la comparaison des définitions détecte la course.
              periodicite: 'annuelle',
              dateValeur: '2026-01-01',
              resultat: 42,
            },
          ],
          { isUserTrusted: true }
        )
      ).rejects.toThrow(
        "La périodicité de l'indicateur 10 a changé de annuelle à mensuelle pendant l'écriture"
      );

      expect(definitionLockRepository.lockDefinitions).toHaveBeenCalledWith(
        [10],
        tx
      );
      expect(tx.insert).not.toHaveBeenCalled();
    });

    it("refuse d'écrire une valeur pour la définition personnalisée d'une autre collectivité", async () => {
      const tx = { insert: vi.fn() };
      const transactionManager = createTransactionManager(tx);
      const foreignDefinition = {
        id: 10,
        collectiviteId: 4,
        identifiantReferentiel: null,
        periodicite: 'annuelle',
        periodiciteMode: 'recommandee',
        precision: 2,
        sansValeurUtilisateur: false,
      };
      const definitionsRepository = {
        listCollectiviteDefinitions: vi
          .fn()
          .mockResolvedValue([foreignDefinition]),
      };
      const definitionLockRepository = {
        lockDefinitions: vi.fn().mockResolvedValue([foreignDefinition]),
      };
      const service = createCrudValeursService(
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        definitionsRepository as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        definitionLockRepository as never,
        transactionManager as never
      );

      await expect(
        service.upsertIndicateurValeurs(
          [
            {
              collectiviteId: 3,
              indicateurId: 10,
              periodicite: 'annuelle',
              dateValeur: '2026-01-01',
              resultat: 42,
            },
          ],
          { isUserTrusted: true }
        )
      ).rejects.toThrow('Indicateur 10 non disponible pour la collectivité 3');

      expect(tx.insert).not.toHaveBeenCalled();
    });

    it("refuse atomiquement un lot contenant un indicateur de groupement dont la collectivité n'est pas membre", async () => {
      const tx = { insert: vi.fn() };
      const transactionManager = createTransactionManager(tx);
      const definitions = [
        {
          id: 10,
          collectiviteId: null,
          groupementId: null,
          identifiantReferentiel: null,
          periodicite: 'annuelle',
          periodiciteMode: 'recommandee',
          precision: 2,
          sansValeurUtilisateur: false,
        },
        {
          id: 11,
          collectiviteId: null,
          groupementId: 99,
          identifiantReferentiel: null,
          periodicite: 'annuelle',
          periodiciteMode: 'recommandee',
          precision: 2,
          sansValeurUtilisateur: false,
        },
      ];
      const repository = {
        lockGroupementMemberships: vi.fn().mockResolvedValue([]),
        upsertValeursWithoutMetadata: vi.fn(),
        upsertValeursWithMetadata: vi.fn(),
      };
      const permissionService = {
        assertAllowed: vi.fn().mockResolvedValue(undefined),
      };
      const definitionsRepository = {
        listCollectiviteDefinitions: vi.fn().mockResolvedValue(definitions),
      };
      const definitionLockRepository = {
        lockDefinitions: vi.fn().mockResolvedValue(definitions),
      };
      const lockRepository = { lock: vi.fn() };
      const service = createCrudValeursService(
        repository as never,
        permissionService as never,
        {} as never,
        {} as never,
        definitionsRepository as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        lockRepository as never,
        definitionLockRepository as never,
        transactionManager as never
      );

      await expect(
        service.upsertIndicateurValeurs(
          [
            {
              collectiviteId: 3,
              indicateurId: 10,
              periodicite: 'annuelle',
              dateValeur: '2026-01-01',
              resultat: 1,
            },
            {
              collectiviteId: 3,
              indicateurId: 11,
              periodicite: 'annuelle',
              dateValeur: '2026-01-01',
              resultat: 2,
            },
          ],
          {
            user: {
              id: '00000000-0000-0000-0000-000000000001',
              role: AuthRole.AUTHENTICATED,
            } as never,
          }
        )
      ).rejects.toThrow('Indicateur 11 non disponible pour la collectivité 3');

      expect(repository.lockGroupementMemberships).toHaveBeenCalledWith(
        [{ groupementId: 99, collectiviteId: 3 }],
        tx
      );
      expect(lockRepository.lock).not.toHaveBeenCalled();
      expect(repository.upsertValeursWithoutMetadata).not.toHaveBeenCalled();
      expect(repository.upsertValeursWithMetadata).not.toHaveBeenCalled();
      expect(tx.insert).not.toHaveBeenCalled();
    });
  });

  describe('recomputeAllCalculatedIndicateurValeurs', () => {
    it('réconcilie et propage une suppression sur la même transaction', async () => {
      const staleValeur = {
        id: 99,
        indicateurId: 3,
        collectiviteId: 1,
        periodicite: 'annuelle',
        dateValeur: '2025-01-01',
        resultat: 4,
        objectif: null,
        calculAuto: true,
        metadonneeId: null,
      };
      const downstreamStaleValeur = {
        ...staleValeur,
        id: 100,
        indicateurId: 4,
      };
      const deletedRows = [[staleValeur], [downstreamStaleValeur]];
      const tx = { marker: 'transaction' };
      const transactionManager = createTransactionManager(tx);
      const repository = {
        deleteAutomaticValeurs: vi.fn(async () => deletedRows.shift() ?? []),
        upsertValeursWithoutMetadata: vi.fn(),
      };
      const target = {
        id: 3,
        identifiantReferentiel: 'target',
        valeurCalcule: 'val(source_a)',
        periodicite: 'mensuelle',
      } as IndicateurDefinition;
      const computedValeur = {
        indicateurId: target.id,
        collectiviteId: 1,
        periodicite: 'mensuelle',
        dateValeur: '2026-02-01',
        resultat: 5,
        objectif: null,
        calculAuto: true,
      };
      const computeValeursService = {
        getAllSourceIdentifiants: vi.fn().mockResolvedValue(['source_a']),
        updateCalculatedIndicateurValeurs: vi.fn().mockResolvedValue([]),
        recomputeCollectiviteCalculatedIndicateurValeurs: vi
          .fn()
          .mockResolvedValue({
            valeursToUpsert: [computedValeur],
            valeurIdsToDelete: [99],
            indicateurIdentifiants: ['target'],
          }),
        reconcileDeletedIndicateurValeurs: vi
          .fn()
          .mockResolvedValueOnce({
            valeursToUpsert: [],
            valeurIdsToDelete: [100],
          })
          .mockResolvedValueOnce({
            valeursToUpsert: [],
            valeurIdsToDelete: [],
          }),
      };
      const service = createCrudValeursService(
        repository as never,
        {} as never,
        {} as never,
        {} as never,
        {
          listCollectiviteDefinitions: vi.fn().mockResolvedValue([target]),
        } as never,
        {} as never,
        {} as never,
        {} as never,
        computeValeursService as never,
        { lock: vi.fn() } as never,
        { lockDefinitions: vi.fn().mockResolvedValue([target]) } as never,
        transactionManager as never
      );
      const upsertedValeur = {
        ...computedValeur,
        indicateurIdentifiant: target.identifiantReferentiel,
      };
      repository.upsertValeursWithoutMetadata.mockResolvedValueOnce([
        upsertedValeur,
      ]);

      await expect(
        service.recomputeAllCalculatedIndicateurValeurs(1, null, {
          definitions: [target],
          skipPermissionCheck: true,
        })
      ).resolves.toEqual([
        {
          collectiviteId: 1,
          valeursCount: 3,
          identifiants: ['target'],
        },
      ]);

      expect(
        computeValeursService.recomputeCollectiviteCalculatedIndicateurValeurs
      ).toHaveBeenCalledWith(1, [target.id], tx);
      expect(
        computeValeursService.reconcileDeletedIndicateurValeurs
      ).toHaveBeenNthCalledWith(1, [staleValeur], tx);
      expect(
        computeValeursService.reconcileDeletedIndicateurValeurs
      ).toHaveBeenNthCalledWith(2, [downstreamStaleValeur], tx);
      expect(repository.upsertValeursWithoutMetadata).toHaveBeenCalledWith(
        [computedValeur],
        tx
      );
      expect(repository.deleteAutomaticValeurs).toHaveBeenCalledTimes(2);
      expect(
        transactionManager.executeSingle.mock.calls.filter(
          ([, existingTx]) => !existingTx
        )
      ).toHaveLength(1);
    });
  });

  describe('deleteIndicateurValeurs', () => {
    it('verrouille, supprime et recalcule dans la même transaction', async () => {
      const events: string[] = [];
      const candidate = {
        id: 7,
        indicateurId: 10,
        collectiviteId: 1,
        periodicite: 'mensuelle',
        dateValeur: '2026-02-01',
        resultat: 5,
        objectif: 6,
        metadonneeId: 2,
      };
      const tx = { marker: 'transaction' };
      const transactionManager = createTransactionManager(tx);
      const repository = {
        listValeursToDelete: vi.fn(async () => {
          events.push('discover-values');
          return [candidate];
        }),
        deleteByIds: vi.fn(async () => {
          events.push('delete-values');
          return [candidate];
        }),
      };
      const computeValeursService = {
        reconcileDeletedIndicateurValeurs: vi.fn(async () => {
          events.push('recalculate');
          return {
            valeursToUpsert: [],
            valeurIdsToDelete: [],
          };
        }),
      };
      const lockRepository = {
        lock: vi.fn(async () => {
          events.push('lock-periods');
        }),
      };
      const definitionLockRepository = {
        lockForValueWrite: vi.fn(async () => {
          events.push('lock-graph');
        }),
      };
      const service = createCrudValeursService(
        repository as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        computeValeursService as never,
        lockRepository as never,
        definitionLockRepository as never,
        transactionManager as never
      );

      await expect(
        service.deleteIndicateurValeurs({
          collectiviteId: candidate.collectiviteId,
          metadonneeId: candidate.metadonneeId,
        })
      ).resolves.toEqual({
        indicateurValeurIdsSupprimes: [{ id: candidate.id }],
      });

      expect(events).toEqual([
        'lock-graph',
        'discover-values',
        'lock-periods',
        'delete-values',
        'recalculate',
      ]);
      expect(
        computeValeursService.reconcileDeletedIndicateurValeurs
      ).toHaveBeenCalledWith([candidate], tx);
    });
  });
});
