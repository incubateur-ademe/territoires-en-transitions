import { INestApplication } from '@nestjs/common';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  ActionDeReference,
  ActionDeReferenceChanges,
  ActionDeReferenceId,
  actionDeReferenceIdSchema,
  ListActionsDeReferenceInput,
  listActionsDeReferenceInputSchema,
} from '@tet/domain/shared';
import { asc, sql } from 'drizzle-orm';
import { TransactionRollbackError } from 'drizzle-orm/errors';
import { beforeAll, describe, expect, it } from 'vitest';
import { ActionsDeReferenceTableRepository } from './actions-de-reference-table.repository';
import { ActionsDeReferenceErrorEnum } from './actions-de-reference.errors';
import { ActionsDeReferenceRepository } from './actions-de-reference.repository';
import { actionDeReferenceTable } from './models/action-de-reference.table';

type ActionToInsert = Omit<ActionDeReference, 'id'>;

const atticInsulationAction: ActionToInsert = {
  titre: 'Isoler les combles',
  description: 'Réduire les pertes de chaleur par la toiture',
  levier: 'sobriete_batiments_residentiel',
  categorie: 'amenagement',
};

const carpoolingAction: ActionToInsert = {
  titre: 'Organiser le covoiturage domicile-travail',
  description: "Mettre en relation les salariés des zones d'activité",
  levier: 'covoiturage',
  categorie: 'gouvernance',
};

const streetLightingAction: ActionToInsert = {
  titre: "Éteindre l'éclairage public la nuit",
  description: 'Couper les lampadaires entre 23 h et 5 h',
  levier: 'electricite_renouvelable',
  categorie: 'exemplarite',
};

const heatNetworkAction: ActionToInsert = {
  titre: 'Raccorder les ecoles au reseau de chaleur',
  description: 'Raccorder les batiments communaux',
  levier: 'reseaux_chaleur_decarbones',
  categorie: 'sensibilisation',
};

const greenElectricityAction: ActionToInsert = {
  titre: 'Acheter une électricité 100% renouvelable',
  description: "Contrat de fourniture à garantie d'origine",
  levier: 'electricite_renouvelable',
  categorie: 'financement',
};

const withWildcardCharactersAction: ActionToInsert = {
  titre: 'Atteindre 100% de LED',
  description: 'Suivre la consommation par code_insee',
  levier: 'electricite_renouvelable',
  categorie: 'planification',
};

const withUnderscoreOnlyInDescriptionAction: ActionToInsert = {
  titre: 'Raccorder les gymnases au reseau de chaleur',
  description: 'Raccorder via le code_insee',
  levier: 'reseaux_chaleur_decarbones',
  categorie: 'sensibilisation',
};

const allActions: readonly ActionToInsert[] = [
  atticInsulationAction,
  carpoolingAction,
  streetLightingAction,
  heatNetworkAction,
  greenElectricityAction,
];

const toListedAction = (
  action: ActionToInsert
): ActionToInsert & { id: unknown } => ({
  ...action,
  id: expect.any(Number),
});

const toListedActions = (
  actions: readonly ActionToInsert[]
): { success: true; data: Array<ActionToInsert & { id: unknown }> } => ({
  success: true,
  data: actions.map(toListedAction),
});

describe('ActionsDeReferenceRepository contract', () => {
  let app: INestApplication;
  let db: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);

    return async (): Promise<void> => {
      await app.close();
    };
  });

  const checkWithOnlyActions = async (
    actions: readonly ActionToInsert[],
    check: (context: {
      repository: ActionsDeReferenceRepository;
      tx: Transaction;
      insertedIds: ActionDeReferenceId[];
    }) => Promise<void>
  ): Promise<void> => {
    try {
      await db.db.transaction(async (tx: Transaction) => {
        await tx.execute(
          sql`lock table ${actionDeReferenceTable} in exclusive mode`
        );
        await tx.delete(actionDeReferenceTable);
        const insertedRows = await tx
          .insert(actionDeReferenceTable)
          .values([...actions])
          .returning({ id: actionDeReferenceTable.id });
        await check({
          repository: new ActionsDeReferenceTableRepository({
            db: tx,
          } as unknown as DatabaseService),
          tx,
          insertedIds: insertedRows.map((row) => row.id),
        });
        tx.rollback();
      });
    } catch (error) {
      if (!(error instanceof TransactionRollbackError)) {
        throw error;
      }
    }
  };

  const expectListed = async ({
    actions,
    input,
    expected,
  }: {
    actions: readonly ActionToInsert[];
    input: ListActionsDeReferenceInput;
    expected: readonly ActionToInsert[];
  }): Promise<void> =>
    checkWithOnlyActions(actions, async ({ repository }) => {
      expect(await repository.list(input)).toEqual(toListedActions(expected));
    });

  describe('list-actions', () => {
    it("renvoie toutes les actions quand aucun filtre n'est donné", async () => {
      await expectListed({
        actions: allActions,
        input: { sortBy: 'titre' },
        expected: [
          greenElectricityAction,
          streetLightingAction,
          atticInsulationAction,
          carpoolingAction,
          heatNetworkAction,
        ],
      });
    });

    it("trouve une action dont le titre contient le texte cherché, n'importe où dans le champ", async () => {
      await expectListed({
        actions: allActions,
        input: { sortBy: 'titre', titre: 'les comb' },
        expected: [atticInsulationAction],
      });
    });

    it("trouve une action dont la description contient le texte cherché, n'importe où dans le champ", async () => {
      await expectListed({
        actions: allActions,
        input: { sortBy: 'titre', description: 'par la toit' },
        expected: [atticInsulationAction],
      });
    });

    it('ignore la casse du texte cherché dans le titre et la description', async () => {
      await expectListed({
        actions: allActions,
        input: {
          sortBy: 'titre',
          titre: 'COMBLES',
          description: 'TOITURE',
        },
        expected: [atticInsulationAction],
      });
    });

    it('ignore la casse du champ dans le titre et la description', async () => {
      await expectListed({
        actions: allActions,
        input: {
          sortBy: 'titre',
          titre: 'éteindre',
          description: 'couper les',
        },
        expected: [streetLightingAction],
      });
    });

    it('ignore les accents du champ dans le titre et la description', async () => {
      await expectListed({
        actions: allActions,
        input: {
          sortBy: 'titre',
          titre: 'electricite',
          description: 'a garantie',
        },
        expected: [greenElectricityAction],
      });
    });

    it('ignore les accents du texte cherché dans le titre et la description', async () => {
      await expectListed({
        actions: allActions,
        input: {
          sortBy: 'titre',
          titre: 'écoles',
          description: 'bâtiments',
        },
        expected: [heatNetworkAction],
      });
    });

    it('cherche % et _ comme des caractères, pas comme des jokers', async () => {
      await expectListed({
        actions: [
          ...allActions,
          withWildcardCharactersAction,
          withUnderscoreOnlyInDescriptionAction,
        ],
        input: { sortBy: 'titre', titre: '%', description: '_' },
        expected: [withWildcardCharactersAction],
      });
    });

    it('cherche ％ et ＿ en pleine chasse comme des caractères, pas comme des jokers', async () => {
      await expectListed({
        actions: [
          ...allActions,
          withWildcardCharactersAction,
          withUnderscoreOnlyInDescriptionAction,
        ],
        input: { sortBy: 'titre', titre: '％', description: '＿' },
        expected: [withWildcardCharactersAction],
      });
    });

    it("renvoie une action qui porte l'un des leviers demandés", async () => {
      await expectListed({
        actions: allActions,
        input: {
          sortBy: 'titre',
          leviers: ['covoiturage', 'electricite_renouvelable'],
        },
        expected: [
          greenElectricityAction,
          streetLightingAction,
          carpoolingAction,
        ],
      });
    });

    it('ne filtre pas sur le levier quand la liste de leviers est absente', async () => {
      await expectListed({
        actions: allActions,
        input: {
          sortBy: 'titre',
          leviers: undefined,
          categories: ['amenagement'],
        },
        expected: [atticInsulationAction],
      });
    });

    it("renvoie une action qui porte l'une des catégories demandées", async () => {
      await expectListed({
        actions: allActions,
        input: {
          sortBy: 'titre',
          categories: ['gouvernance', 'sensibilisation'],
        },
        expected: [carpoolingAction, heatNetworkAction],
      });
    });

    it('ne filtre pas sur la catégorie quand la liste de catégories est absente', async () => {
      await expectListed({
        actions: allActions,
        input: {
          sortBy: 'titre',
          leviers: ['covoiturage'],
          categories: undefined,
        },
        expected: [carpoolingAction],
      });
    });

    it("ne renvoie que les actions dont le titre contient le texte cherché et qui portent l'un des leviers demandés", async () => {
      const publicBuildingsInsulationAction: ActionToInsert = {
        ...atticInsulationAction,
        titre: 'Isoler les combles des bâtiments publics',
        levier: 'electricite_renouvelable',
      };

      await expectListed({
        actions: [...allActions, publicBuildingsInsulationAction],
        input: {
          sortBy: 'titre',
          titre: 'combles',
          leviers: ['covoiturage', 'electricite_renouvelable'],
        },
        expected: [publicBuildingsInsulationAction],
      });
    });

    it('ne renvoie pas une action dont seul le titre contient le texte cherché quand une description est aussi cherchée', async () => {
      await expectListed({
        actions: allActions,
        input: {
          sortBy: 'titre',
          titre: 'combles',
          description: 'lampadaires',
        },
        expected: [],
      });
    });

    it("renvoie une action dont le titre contient le texte cherché et qui porte l'un des leviers ou l'une des catégories demandés", async () => {
      const carpoolingDepotInsulationAction: ActionToInsert = {
        ...carpoolingAction,
        titre: 'Isoler les combles du dépôt de covoiturage',
      };

      await expectListed({
        actions: [...allActions, carpoolingDepotInsulationAction],
        input: {
          sortBy: 'titre',
          titre: 'combles',
          leviers: ['covoiturage'],
          categories: ['amenagement', 'sensibilisation'],
        },
        expected: [atticInsulationAction, carpoolingDepotInsulationAction],
      });
    });

    it("ne renvoie pas une action qui ne satisfait qu'une partie des filtres", async () => {
      await expectListed({
        actions: [atticInsulationAction, greenElectricityAction],
        input: {
          sortBy: 'titre',
          titre: 'combles',
          description: 'toiture',
          leviers: ['covoiturage'],
          categories: ['sensibilisation'],
        },
        expected: [],
      });
    });

    it('renvoie toutes les actions quand les listes de leviers et de catégories sont absentes et sans autre filtre', async () => {
      await expectListed({
        actions: allActions,
        input: { sortBy: 'titre', leviers: undefined, categories: undefined },
        expected: [
          greenElectricityAction,
          streetLightingAction,
          atticInsulationAction,
          carpoolingAction,
          heatNetworkAction,
        ],
      });
    });

    it('ne filtre pas sur le titre ni sur la description quand le texte cherché est absent', async () => {
      await expectListed({
        actions: allActions,
        input: { sortBy: 'titre', titre: undefined, description: undefined },
        expected: [
          greenElectricityAction,
          streetLightingAction,
          atticInsulationAction,
          carpoolingAction,
          heatNetworkAction,
        ],
      });
    });

    it('renvoie les seules actions des leviers ou catégories demandés quand le titre et la description cherchés sont absents', async () => {
      await expectListed({
        actions: allActions,
        input: {
          sortBy: 'titre',
          titre: undefined,
          description: undefined,
          leviers: ['covoiturage'],
          categories: ['amenagement'],
        },
        expected: [atticInsulationAction, carpoolingAction],
      });
    });

    it('renvoie une liste vide quand aucune action ne correspond', async () => {
      await expectListed({
        actions: allActions,
        input: { sortBy: 'titre', titre: 'méthanisation' },
        expected: [],
      });
    });

    it('trie par titre croissant par défaut', async () => {
      const withTitreB: ActionToInsert = {
        ...atticInsulationAction,
        titre: 'B action',
      };
      const withTitreA: ActionToInsert = {
        ...carpoolingAction,
        titre: 'A action',
      };
      const withTitreC: ActionToInsert = {
        ...heatNetworkAction,
        titre: 'C action',
      };

      await expectListed({
        actions: [withTitreB, withTitreC, withTitreA],
        input: listActionsDeReferenceInputSchema.parse({}),
        expected: [withTitreA, withTitreB, withTitreC],
      });
    });

    it('à titre égal, trie par identifiant de levier croissant', async () => {
      const withCovoiturageLevier: ActionToInsert = {
        ...carpoolingAction,
        titre: 'Même action',
        levier: 'covoiturage',
        categorie: 'amenagement',
      };
      const withBiogazLevier: ActionToInsert = {
        ...carpoolingAction,
        titre: 'Même action',
        levier: 'biogaz',
        categorie: 'sensibilisation',
      };

      await expectListed({
        actions: [withCovoiturageLevier, withBiogazLevier],
        input: { sortBy: 'titre' },
        expected: [withBiogazLevier, withCovoiturageLevier],
      });
    });

    it('à titre et levier égaux, trie par identifiant de catégorie croissant', async () => {
      const withPlanificationCategorie: ActionToInsert = {
        ...carpoolingAction,
        titre: 'Même action',
        categorie: 'planification',
      };
      const withExemplariteCategorie: ActionToInsert = {
        ...carpoolingAction,
        titre: 'Même action',
        categorie: 'exemplarite',
      };

      await expectListed({
        actions: [withPlanificationCategorie, withExemplariteCategorie],
        input: { sortBy: 'titre' },
        expected: [withExemplariteCategorie, withPlanificationCategorie],
      });
    });

    it('trie par levier croissant quand le tri demandé est le levier', async () => {
      const withVeloLevier: ActionToInsert = {
        ...atticInsulationAction,
        titre: 'A action',
        levier: 'velo_transport_commun',
      };
      const withCovoiturageLevier: ActionToInsert = {
        ...atticInsulationAction,
        titre: 'B action',
        levier: 'covoiturage',
      };

      await expectListed({
        actions: [withVeloLevier, withCovoiturageLevier],
        input: { sortBy: 'levier' },
        expected: [withCovoiturageLevier, withVeloLevier],
      });
    });

    it("trie les leviers dans l'ordre alphabétique de leur identifiant, pas dans l'ordre de leur déclaration", async () => {
      const withVeloLevier: ActionToInsert = {
        ...atticInsulationAction,
        titre: 'A action',
        levier: 'velo_transport_commun',
      };
      const withBiogazLevier: ActionToInsert = {
        ...atticInsulationAction,
        titre: 'B action',
        levier: 'biogaz',
      };

      await expectListed({
        actions: [withVeloLevier, withBiogazLevier],
        input: { sortBy: 'levier' },
        expected: [withBiogazLevier, withVeloLevier],
      });
    });

    it('à levier égal, trie par titre croissant', async () => {
      const withTitreB: ActionToInsert = {
        ...carpoolingAction,
        titre: 'B action',
        categorie: 'amenagement',
      };
      const withTitreA: ActionToInsert = {
        ...carpoolingAction,
        titre: 'A action',
        categorie: 'sensibilisation',
      };

      await expectListed({
        actions: [withTitreB, withTitreA],
        input: { sortBy: 'levier' },
        expected: [withTitreA, withTitreB],
      });
    });

    it('à levier et titre égaux, trie par identifiant de catégorie croissant', async () => {
      const withPlanificationCategorie: ActionToInsert = {
        ...carpoolingAction,
        titre: 'Même action',
        categorie: 'planification',
      };
      const withExemplariteCategorie: ActionToInsert = {
        ...carpoolingAction,
        titre: 'Même action',
        categorie: 'exemplarite',
      };

      await expectListed({
        actions: [withPlanificationCategorie, withExemplariteCategorie],
        input: { sortBy: 'levier' },
        expected: [withExemplariteCategorie, withPlanificationCategorie],
      });
    });

    it('trie par catégorie croissante quand le tri demandé est la catégorie', async () => {
      const withSensibilisationCategorie: ActionToInsert = {
        ...atticInsulationAction,
        titre: 'A action',
        categorie: 'sensibilisation',
      };
      const withAmenagementCategorie: ActionToInsert = {
        ...atticInsulationAction,
        titre: 'B action',
        categorie: 'amenagement',
      };

      await expectListed({
        actions: [withSensibilisationCategorie, withAmenagementCategorie],
        input: { sortBy: 'categorie' },
        expected: [withAmenagementCategorie, withSensibilisationCategorie],
      });
    });

    it("trie les catégories dans l'ordre alphabétique de leur identifiant, pas dans l'ordre de leur déclaration", async () => {
      const withPlanificationCategorie: ActionToInsert = {
        ...atticInsulationAction,
        titre: 'A action',
        categorie: 'planification',
      };
      const withExemplariteCategorie: ActionToInsert = {
        ...atticInsulationAction,
        titre: 'B action',
        categorie: 'exemplarite',
      };

      await expectListed({
        actions: [withPlanificationCategorie, withExemplariteCategorie],
        input: { sortBy: 'categorie' },
        expected: [withExemplariteCategorie, withPlanificationCategorie],
      });
    });

    it('à catégorie égale, trie par titre croissant', async () => {
      const withTitreB: ActionToInsert = {
        ...atticInsulationAction,
        titre: 'B action',
        levier: 'biogaz',
      };
      const withTitreA: ActionToInsert = {
        ...atticInsulationAction,
        titre: 'A action',
        levier: 'velo_transport_commun',
      };

      await expectListed({
        actions: [withTitreB, withTitreA],
        input: { sortBy: 'categorie' },
        expected: [withTitreA, withTitreB],
      });
    });

    it('à catégorie et titre égaux, trie par identifiant de levier croissant', async () => {
      const withCovoiturageLevier: ActionToInsert = {
        ...atticInsulationAction,
        titre: 'Même action',
        levier: 'covoiturage',
      };
      const withBiogazLevier: ActionToInsert = {
        ...atticInsulationAction,
        titre: 'Même action',
        levier: 'biogaz',
      };

      await expectListed({
        actions: [withCovoiturageLevier, withBiogazLevier],
        input: { sortBy: 'categorie' },
        expected: [withBiogazLevier, withCovoiturageLevier],
      });
    });

    it('renvoie toutes les actions correspondantes, sans pagination', async () => {
      const manyActions: readonly ActionToInsert[] = Array.from(
        { length: 150 },
        (_, index) => ({
          ...atticInsulationAction,
          titre: `Action ${String(index).padStart(3, '0')}`,
        })
      );

      await expectListed({
        actions: manyActions,
        input: { sortBy: 'titre' },
        expected: manyActions,
      });
    });
  });

  describe('update-action', () => {
    const unknownActionDeReferenceId =
      actionDeReferenceIdSchema.parse(2147483647);

    const readStoredActions = (tx: Transaction): Promise<ActionToInsert[]> =>
      tx
        .select({
          titre: actionDeReferenceTable.titre,
          description: actionDeReferenceTable.description,
          levier: actionDeReferenceTable.levier,
          categorie: actionDeReferenceTable.categorie,
        })
        .from(actionDeReferenceTable)
        .orderBy(asc(actionDeReferenceTable.id));

    const atticTripletChanges: ActionDeReferenceChanges = {
      titre: atticInsulationAction.titre,
      levier: atticInsulationAction.levier,
      categorie: atticInsulationAction.categorie,
    };

    const toRepositoryWithoutOwnDatabase = (): ActionsDeReferenceRepository =>
      new ActionsDeReferenceTableRepository({
        db: undefined,
      } as unknown as DatabaseService);

    const expectUnknownIdUpdate = async (
      changes: ActionDeReferenceChanges
    ): Promise<void> =>
      checkWithOnlyActions(
        [atticInsulationAction, carpoolingAction],
        async ({ repository, tx }) => {
          const updateResult = await repository.update({
            id: unknownActionDeReferenceId,
            changes,
          });
          expect({
            updateResult,
            storedActions: await readStoredActions(tx),
          }).toEqual({
            updateResult: {
              success: false,
              error: ActionsDeReferenceErrorEnum.ACTION_DE_REFERENCE_NOT_FOUND,
            },
            storedActions: [atticInsulationAction, carpoolingAction],
          });
        }
      );

    it("modifie le titre, la description, le levier et la catégorie donnés et renvoie l'id", async () => {
      const lostAtticInsulationAction: ActionToInsert = {
        titre: 'Isoler les combles perdus',
        description: 'Souffler de la ouate de cellulose',
        levier: 'chaudieres_gaz_renovation_residentiel',
        categorie: 'financement',
      };

      await checkWithOnlyActions(
        [atticInsulationAction, carpoolingAction],
        async ({ repository, tx, insertedIds: [atticId] }) => {
          const updateResult = await repository.update({
            id: atticId,
            changes: lostAtticInsulationAction,
          });
          expect({
            updateResult,
            storedActions: await readStoredActions(tx),
          }).toEqual({
            updateResult: { success: true, data: { id: atticId } },
            storedActions: [lostAtticInsulationAction, carpoolingAction],
          });
        }
      );
    });

    it('laisse inchangés les champs absents de la mise à jour', async () => {
      await checkWithOnlyActions(
        [atticInsulationAction, carpoolingAction],
        async ({ repository, tx, insertedIds: [atticId] }) => {
          const updateResult = await repository.update({
            id: atticId,
            changes: { titre: 'Isoler les combles perdus' },
          });
          expect({
            updateResult,
            storedActions: await readStoredActions(tx),
          }).toEqual({
            updateResult: { success: true, data: { id: atticId } },
            storedActions: [
              { ...atticInsulationAction, titre: 'Isoler les combles perdus' },
              carpoolingAction,
            ],
          });
        }
      );
    });

    it("renvoie l'id sans rien modifier quand seul l'id est donné et que l'action existe", async () => {
      await checkWithOnlyActions(
        [atticInsulationAction, carpoolingAction],
        async ({ repository, tx, insertedIds: [atticId] }) => {
          const updateResult = await repository.update({
            id: atticId,
            changes: {},
          });
          expect({
            updateResult,
            storedActions: await readStoredActions(tx),
          }).toEqual({
            updateResult: { success: true, data: { id: atticId } },
            storedActions: [atticInsulationAction, carpoolingAction],
          });
        }
      );
    });

    it("renvoie l'id sans rien modifier, sans erreur, quand tous les champs à modifier sont undefined", async () => {
      await checkWithOnlyActions(
        [atticInsulationAction, carpoolingAction],
        async ({ repository, tx, insertedIds: [atticId] }) => {
          const updateResult = await repository.update({
            id: atticId,
            changes: {
              titre: undefined,
              description: undefined,
              levier: undefined,
              categorie: undefined,
            },
          });
          expect({
            updateResult,
            storedActions: await readStoredActions(tx),
          }).toEqual({
            updateResult: { success: true, data: { id: atticId } },
            storedActions: [atticInsulationAction, carpoolingAction],
          });
        }
      );
    });

    it('renvoie ACTION_DE_REFERENCE_NOT_FOUND pour un id inconnu', async () => {
      await expectUnknownIdUpdate({ titre: 'Isoler les combles perdus' });
    });

    it("renvoie ACTION_DE_REFERENCE_NOT_FOUND pour un id inconnu quand seul l'id est donné", async () => {
      await expectUnknownIdUpdate({});
    });

    it('renvoie ACTION_DE_REFERENCE_CONFLICT quand le triplet levier, catégorie, titre existe déjà sur une autre action', async () => {
      await checkWithOnlyActions(
        [atticInsulationAction, carpoolingAction],
        async ({ repository, insertedIds: [, carpoolingId] }) => {
          expect(
            await repository.update({
              id: carpoolingId,
              changes: atticTripletChanges,
            })
          ).toEqual({
            success: false,
            error: ActionsDeReferenceErrorEnum.ACTION_DE_REFERENCE_CONFLICT,
          });
        }
      );
    });

    it("laisse l'action inchangée en base après un conflit", async () => {
      await checkWithOnlyActions(
        [atticInsulationAction, carpoolingAction],
        async ({ repository, tx, insertedIds: [, carpoolingId] }) => {
          const updateResult = await repository.update({
            id: carpoolingId,
            changes: atticTripletChanges,
          });
          expect({
            updateResult,
            storedActions: await readStoredActions(tx),
          }).toEqual({
            updateResult: {
              success: false,
              error: ActionsDeReferenceErrorEnum.ACTION_DE_REFERENCE_CONFLICT,
            },
            storedActions: [atticInsulationAction, carpoolingAction],
          });
        }
      );
    });

    it("applique la mise à jour dans la transaction passée par l'appelant", async () => {
      await checkWithOnlyActions(
        [atticInsulationAction, carpoolingAction],
        async ({ tx, insertedIds: [atticId] }) => {
          const updateResult = await toRepositoryWithoutOwnDatabase().update({
            id: atticId,
            changes: { titre: 'Isoler les combles perdus' },
            tx,
          });
          expect({
            updateResult,
            storedActions: await readStoredActions(tx),
          }).toEqual({
            updateResult: { success: true, data: { id: atticId } },
            storedActions: [
              { ...atticInsulationAction, titre: 'Isoler les combles perdus' },
              carpoolingAction,
            ],
          });
        }
      );
    });

    it("laisse utilisable la transaction passée par l'appelant après un conflit", async () => {
      await checkWithOnlyActions(
        [atticInsulationAction, carpoolingAction],
        async ({ tx, insertedIds: [, carpoolingId] }) => {
          const updateResult = await toRepositoryWithoutOwnDatabase().update({
            id: carpoolingId,
            changes: atticTripletChanges,
            tx,
          });
          expect({
            updateResult,
            storedActions: await readStoredActions(tx),
          }).toEqual({
            updateResult: {
              success: false,
              error: ActionsDeReferenceErrorEnum.ACTION_DE_REFERENCE_CONFLICT,
            },
            storedActions: [atticInsulationAction, carpoolingAction],
          });
        }
      );
    });
  });
});
