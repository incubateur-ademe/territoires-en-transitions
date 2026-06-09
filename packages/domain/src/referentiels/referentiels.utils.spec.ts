import { ActionTypeEnum } from './actions/action-type.enum';
import {
  filterHiddenActionsFromGroupedById,
  getActionTypeFromActionId,
  getLevelFromActionId,
  isActionHidden,
  isNewReferentiel,
  normalizeIdentifiantReferentiel,
  rollUpActionIdToActionLevel,
  scoreSnapshotTreeToActionsWithGenealogyGroupedById,
} from './referentiel.utils';

describe('getLevelFromActionId', () => {
  test('Standard action', async () => {
    expect(getLevelFromActionId('cae_5.1.4.4.1')).toEqual(5);
  });

  test('Axe', async () => {
    expect(getLevelFromActionId('cae_5')).toEqual(1);
    expect(getLevelFromActionId('5')).toEqual(1);
  });

  test('Referentiel', async () => {
    expect(getLevelFromActionId('cae')).toEqual(0);
  });
});

describe('getActionTypeFromActionId', () => {
  test('Standard action', async () => {
    expect(
      getActionTypeFromActionId('cae_5.1.4.4.1', [
        ActionTypeEnum.REFERENTIEL,
        ActionTypeEnum.AXE,
        ActionTypeEnum.SOUS_AXE,
        ActionTypeEnum.ACTION,
        ActionTypeEnum.SOUS_ACTION,
        ActionTypeEnum.TACHE,
      ])
    ).toEqual(ActionTypeEnum.TACHE);
  });

  test('Axe', async () => {
    expect(
      getActionTypeFromActionId('cae_5', [
        ActionTypeEnum.REFERENTIEL,
        ActionTypeEnum.AXE,
        ActionTypeEnum.SOUS_AXE,
        ActionTypeEnum.ACTION,
        ActionTypeEnum.SOUS_ACTION,
        ActionTypeEnum.TACHE,
      ])
    ).toEqual(ActionTypeEnum.AXE);
  });

  test('Referentiel', async () => {
    expect(
      getActionTypeFromActionId('cae', [
        ActionTypeEnum.REFERENTIEL,
        ActionTypeEnum.AXE,
        ActionTypeEnum.SOUS_AXE,
        ActionTypeEnum.ACTION,
        ActionTypeEnum.SOUS_ACTION,
        ActionTypeEnum.TACHE,
      ])
    ).toEqual(ActionTypeEnum.REFERENTIEL);
  });

  test('Throw', async () => {
    expect(() =>
      getActionTypeFromActionId('cae_5.1.4.4.1.1', [
        ActionTypeEnum.REFERENTIEL,
        ActionTypeEnum.AXE,
        ActionTypeEnum.SOUS_AXE,
        ActionTypeEnum.ACTION,
        ActionTypeEnum.SOUS_ACTION,
        ActionTypeEnum.TACHE,
      ])
    ).toThrow(
      'Action level 6 non consistent with referentiel action types: referentiel,axe,sous-axe,action,sous-action,tache'
    );
  });
});

const hierarchieAvecAction = [
  ActionTypeEnum.REFERENTIEL,
  ActionTypeEnum.AXE,
  ActionTypeEnum.SOUS_AXE,
  ActionTypeEnum.ACTION,
  ActionTypeEnum.SOUS_ACTION,
  ActionTypeEnum.TACHE,
] as const;

describe('rollUpActionIdToActionLevel', () => {
  test('remonte une tâche vers le nœud action', () => {
    expect(
      rollUpActionIdToActionLevel('cae_5.1.4.4.1', [...hierarchieAvecAction])
    ).toEqual('cae_5.1.4');
  });

  test('remonte une sous-action vers le nœud action', () => {
    expect(
      rollUpActionIdToActionLevel('cae_5.1.4.4', [...hierarchieAvecAction])
    ).toEqual('cae_5.1.4');
  });

  test('laisse inchangé un nœud déjà au niveau action', () => {
    expect(
      rollUpActionIdToActionLevel('cae_5.1.4', [...hierarchieAvecAction])
    ).toEqual('cae_5.1.4');
  });

  test('laisse inchangé un niveau moins profond que action (axe)', () => {
    expect(
      rollUpActionIdToActionLevel('cae_5', [...hierarchieAvecAction])
    ).toEqual('cae_5');
  });

  test('sans type action dans la hiérarchie, ne modifie pas', () => {
    const sansAction = [
      ActionTypeEnum.REFERENTIEL,
      ActionTypeEnum.AXE,
      ActionTypeEnum.SOUS_AXE,
    ];
    expect(rollUpActionIdToActionLevel('cae_5.1.4.4.1', sansAction)).toEqual(
      'cae_5.1.4.4.1'
    );
  });
});

describe('isActionHidden', () => {
  test('masque uniquement si TE activé et action désactivée', () => {
    expect(isActionHidden(true, true)).toBe(true);
    expect(isActionHidden(true, false)).toBe(false);
    expect(isActionHidden(false, true)).toBe(false);
  });
});

describe('isNewReferentiel', () => {
  test('uniquement pour les référentiels TE', () => {
    expect(isNewReferentiel('te')).toBe(true);
    expect(isNewReferentiel('te-test')).toBe(true);
    expect(isNewReferentiel('eci')).toBe(false);
    expect(isNewReferentiel('cae')).toBe(false);
  });
});

describe('filterHiddenActionsFromGroupedById', () => {
  test('retire les actions désactivées et nettoie les childrenIds', () => {
    const actions = {
      te: {
        actionId: 'te',
        childrenIds: ['te_1', 'te_2'],
        nextId: null,
        previousId: null,
        score: { desactive: false },
      },
      te_1: {
        actionId: 'te_1',
        childrenIds: ['te_1.1'],
        nextId: 'te_2',
        previousId: null,
        score: { desactive: false },
      },
      'te_1.1': {
        actionId: 'te_1.1',
        childrenIds: [],
        nextId: null,
        previousId: null,
        score: { desactive: true },
      },
      te_2: {
        actionId: 'te_2',
        childrenIds: [],
        nextId: null,
        previousId: 'te_1',
        score: { desactive: false },
      },
    };

    const filtered = filterHiddenActionsFromGroupedById(actions);

    expect(Object.keys(filtered).sort()).toEqual(['te', 'te_1', 'te_2']);
    expect(filtered.te.childrenIds).toEqual(['te_1', 'te_2']);
    expect(filtered.te_1.childrenIds).toEqual([]);
  });

  test('redirige nextId/previousId vers des mesures visibles', () => {
    const actions = {
      te_2: {
        actionId: 'te_2',
        childrenIds: ['te_2.2', 'te_2.3', 'te_2.4', 'te_2.5'],
        nextId: null,
        previousId: null,
        score: { desactive: false },
      },
      'te_2.2': {
        actionId: 'te_2.2',
        childrenIds: [],
        nextId: 'te_2.3',
        previousId: null,
        score: { desactive: false },
      },
      'te_2.3': {
        actionId: 'te_2.3',
        childrenIds: [],
        nextId: 'te_2.4',
        previousId: 'te_2.2',
        score: { desactive: true },
      },
      'te_2.4': {
        actionId: 'te_2.4',
        childrenIds: [],
        nextId: 'te_2.5',
        previousId: 'te_2.3',
        score: { desactive: true },
      },
      'te_2.5': {
        actionId: 'te_2.5',
        childrenIds: [],
        nextId: null,
        previousId: 'te_2.4',
        score: { desactive: false },
      },
    };

    const filtered = filterHiddenActionsFromGroupedById(actions);

    expect(Object.keys(filtered).sort()).toEqual([
      'te_2',
      'te_2.2',
      'te_2.5',
    ]);
    expect(filtered['te_2.2']).toMatchObject({
      nextId: 'te_2.5',
      previousId: null,
    });
    expect(filtered['te_2.5']).toMatchObject({
      nextId: null,
      previousId: 'te_2.2',
    });
  });
});

describe('normalizeIdentifiantReferentiel', () => {
  describe('CAE prefix', () => {
    test('normalise cae18 vers cae_18', () => {
      expect(normalizeIdentifiantReferentiel('cae18')).toBe('cae_18');
    });

    test('normalise cae_18 vers cae_18', () => {
      expect(normalizeIdentifiantReferentiel('cae_18')).toBe('cae_18');
    });

    test('normalise cae 18 vers cae_18', () => {
      expect(normalizeIdentifiantReferentiel('cae 18')).toBe('cae_18');
    });

    test('normalise cae18a vers cae_18.a', () => {
      expect(normalizeIdentifiantReferentiel('cae18a')).toBe('cae_18.a');
    });

    test('normalise cae_18.a vers cae_18.a', () => {
      expect(normalizeIdentifiantReferentiel('cae_18.a')).toBe('cae_18.a');
    });

    test('normalise cae 18 a vers cae_18.a', () => {
      expect(normalizeIdentifiantReferentiel('cae 18 a')).toBe('cae_18.a');
    });

    test('normalise cae1a vers cae_1.a', () => {
      expect(normalizeIdentifiantReferentiel('cae1a')).toBe('cae_1.a');
    });

    test('normalise cae_1.a vers cae_1.a', () => {
      expect(normalizeIdentifiantReferentiel('cae_1.a')).toBe('cae_1.a');
    });

    test('normalise cae1.ca vers cae_1.ca', () => {
      expect(normalizeIdentifiantReferentiel('cae1.ca')).toBe('cae_1.ca');
    });

    test('normalise cae1ca vers cae_1.ca', () => {
      expect(normalizeIdentifiantReferentiel('cae1ca')).toBe('cae_1.ca');
    });

    test('gère les majuscules', () => {
      expect(normalizeIdentifiantReferentiel('CAE_18')).toBe('cae_18');
      expect(normalizeIdentifiantReferentiel('CAE18A')).toBe('cae_18.a');
    });
  });

  describe('ECI prefix', () => {
    test('normalise eci2 vers eci_2', () => {
      expect(normalizeIdentifiantReferentiel('eci2')).toBe('eci_2');
    });

    test('normalise eci_2 vers eci_2', () => {
      expect(normalizeIdentifiantReferentiel('eci_2')).toBe('eci_2');
    });

    test('normalise eci 2 vers eci_2', () => {
      expect(normalizeIdentifiantReferentiel('eci 2')).toBe('eci_2');
    });

    test('normalise eci2a vers eci_2.a', () => {
      expect(normalizeIdentifiantReferentiel('eci2a')).toBe('eci_2.a');
    });
  });

  describe('CRTE prefix', () => {
    test('normalise crte1 vers crte_1', () => {
      expect(normalizeIdentifiantReferentiel('crte1')).toBe('crte_1');
    });

    test('normalise crte_1 vers crte_1', () => {
      expect(normalizeIdentifiantReferentiel('crte_1')).toBe('crte_1');
    });

    test('normalise crte1.1 vers crte_1.1', () => {
      expect(normalizeIdentifiantReferentiel('crte1.1')).toBe('crte_1.1');
    });

    test('normalise crte_1.1 vers crte_1.1', () => {
      expect(normalizeIdentifiantReferentiel('crte_1.1')).toBe('crte_1.1');
    });
  });

  describe('Invalid inputs', () => {
    test('retourne null pour un texte sans prefix valide', () => {
      expect(normalizeIdentifiantReferentiel('test')).toBeNull();
      expect(normalizeIdentifiantReferentiel('abc123')).toBeNull();
      expect(normalizeIdentifiantReferentiel('hello world')).toBeNull();
    });

    test('retourne null pour un prefix seul', () => {
      expect(normalizeIdentifiantReferentiel('cae')).toBeNull();
      expect(normalizeIdentifiantReferentiel('eci')).toBeNull();
      expect(normalizeIdentifiantReferentiel('crte')).toBeNull();
    });

    test('retourne null pour un format invalide', () => {
      expect(normalizeIdentifiantReferentiel('cae_abc')).toBeNull();
      expect(normalizeIdentifiantReferentiel('eci-2')).toBeNull();
    });
  });

  describe('Edge cases', () => {
    test('gère les espaces multiples', () => {
      expect(normalizeIdentifiantReferentiel('cae  18  a')).toBe('cae_18.a');
    });

    test('gère les underscores multiples', () => {
      expect(normalizeIdentifiantReferentiel('cae___18')).toBe('cae_18');
    });

    test('gère les nombres avec plusieurs niveaux', () => {
      expect(normalizeIdentifiantReferentiel('cae1.1.2')).toBe('cae_1.1.2');
      expect(normalizeIdentifiantReferentiel('cae 1.1.2')).toBe('cae_1.1.2');
    });

    test('gère les identifiants avec tirets', () => {
      expect(normalizeIdentifiantReferentiel('cae49a-hab')).toBe(
        'cae_49.a-hab'
      );
      expect(normalizeIdentifiantReferentiel('cae_49.a-hab')).toBe(
        'cae_49.a-hab'
      );
      expect(normalizeIdentifiantReferentiel('cae 49 a-hab')).toBe(
        'cae_49.a-hab'
      );
    });
  });
});

describe('scoreSnapshotTreeToActionsWithGenealogyGroupedById', () => {
  type TestAction = {
    actionId: string;
    actionsEnfant: TestAction[];
    score: { desactive: boolean | undefined };
  };

  const makeAction = (
    actionId: string,
    options: { desactive?: boolean; children?: TestAction[] } = {}
  ): TestAction => ({
    actionId,
    actionsEnfant: options.children ?? [],
    score: { desactive: options.desactive ?? false },
  });

  /**
   * Arbre de référence :
   * eci
   * ├── eci_1
   * │   ├── eci_1.1
   * │   ├── eci_1.2
   * │   └── eci_1.3
   * ├── eci_2
   * │   ├── eci_2.1 .. eci_2.5
   * └── eci_3
   *     ├── eci_3.1
   *     └── eci_3.2
   */
  const buildReferenceTree = (): TestAction =>
    makeAction('eci', {
      children: [
        makeAction('eci_1', {
          children: [
            makeAction('eci_1.1'),
            makeAction('eci_1.2'),
            makeAction('eci_1.3'),
          ],
        }),
        makeAction('eci_2', {
          children: [
            makeAction('eci_2.1'),
            makeAction('eci_2.2'),
            makeAction('eci_2.3'),
            makeAction('eci_2.4'),
            makeAction('eci_2.5'),
          ],
        }),
        makeAction('eci_3', {
          children: [makeAction('eci_3.1'), makeAction('eci_3.2')],
        }),
      ],
    });

  describe('navigation au sein des frères du même parent', () => {
    test('previousId / nextId pointent vers les frères directs', () => {
      const result = scoreSnapshotTreeToActionsWithGenealogyGroupedById(
        buildReferenceTree()
      );

      expect(result['eci_1.2']).toMatchObject({
        previousId: 'eci_1.1',
        nextId: 'eci_1.3',
      });
    });

    test('navigation entre axes (niveau 1)', () => {
      const result = scoreSnapshotTreeToActionsWithGenealogyGroupedById(
        buildReferenceTree()
      );

      expect(result['eci_1']).toMatchObject({
        previousId: null,
        nextId: 'eci_2',
      });
      expect(result['eci_2']).toMatchObject({
        previousId: 'eci_1',
        nextId: 'eci_3',
      });
      expect(result['eci_3']).toMatchObject({
        previousId: 'eci_2',
        nextId: null,
      });
    });

    test("la racine (niveau 0) n'a ni next ni previous ni parent", () => {
      const result = scoreSnapshotTreeToActionsWithGenealogyGroupedById(
        buildReferenceTree()
      );

      expect(result['eci']).toMatchObject({
        previousId: null,
        nextId: null,
        parentId: null,
      });
    });
  });

  describe('navigation à travers les frontières de parent', () => {
    test('le premier enfant d’un parent pointe vers le dernier enfant du parent précédent', () => {
      const result = scoreSnapshotTreeToActionsWithGenealogyGroupedById(
        buildReferenceTree()
      );

      expect(result['eci_2.1']).toMatchObject({
        previousId: 'eci_1.3',
        nextId: 'eci_2.2',
      });
    });

    test('le dernier enfant d’un parent pointe vers le premier enfant du parent suivant', () => {
      const result = scoreSnapshotTreeToActionsWithGenealogyGroupedById(
        buildReferenceTree()
      );

      expect(result['eci_2.5']).toMatchObject({
        previousId: 'eci_2.4',
        nextId: 'eci_3.1',
      });
    });

    test('le tout premier enfant a previousId = null', () => {
      const result = scoreSnapshotTreeToActionsWithGenealogyGroupedById(
        buildReferenceTree()
      );

      expect(result['eci_1.1'].previousId).toBeNull();
      expect(result['eci_1.1'].nextId).toBe('eci_1.2');
    });

    test('le tout dernier enfant a nextId = null', () => {
      const result = scoreSnapshotTreeToActionsWithGenealogyGroupedById(
        buildReferenceTree()
      );

      expect(result['eci_3.2'].previousId).toBe('eci_3.1');
      expect(result['eci_3.2'].nextId).toBeNull();
    });

    test("ignore l'arithmétique d'identifiants : suit l'ordre réel de l'arbre", () => {
      const tree = makeAction('eci', {
        children: [
          makeAction('eci_1', {
            children: [makeAction('eci_1.1'), makeAction('eci_1.3')],
          }),
          makeAction('eci_2', {
            children: [makeAction('eci_2.2')],
          }),
        ],
      });

      const result = scoreSnapshotTreeToActionsWithGenealogyGroupedById(tree);

      expect(result['eci_1.1'].nextId).toBe('eci_1.3');
      expect(result['eci_1.3'].nextId).toBe('eci_2.2');
      expect(result['eci_2.2'].previousId).toBe('eci_1.3');
    });
  });

  describe('saut des actions désactivées', () => {
    test('ne saute pas les actions désactivées quand includeDesactive=true (anciens référentiels) ', () => {
      const tree = makeAction('eci', {
        children: [
          makeAction('eci_1', {
            children: [
              makeAction('eci_1.1'),
              makeAction('eci_1.2', { desactive: true }),
              makeAction('eci_1.3'),
            ],
          }),
        ],
      });

      const result = scoreSnapshotTreeToActionsWithGenealogyGroupedById(
        tree,
        { includeDesactive: true }
      );

      expect(result['eci_1.1'].nextId).toBe('eci_1.2');
      expect(result['eci_1.2'].nextId).toBe('eci_1.3');
      expect(result['eci_1.3'].previousId).toBe('eci_1.2');
    });

    test('saute une action désactivée vers l’avant', () => {
      const tree = makeAction('te', {
        children: [
          makeAction('te_1', {
            children: [
              makeAction('te_1.1'),
              makeAction('te_1.2', { desactive: true }),
              makeAction('te_1.3'),
            ],
          }),
        ],
      });

      const result = scoreSnapshotTreeToActionsWithGenealogyGroupedById(tree);

      expect(result['te_1.1'].nextId).toBe('te_1.3');
      expect(result['te_1.3'].previousId).toBe('te_1.1');
    });

    test('saute plusieurs actions désactivées consécutives', () => {
      const tree = makeAction('te', {
        children: [
          makeAction('te_1', {
            children: [
              makeAction('te_1.1'),
              makeAction('te_1.2', { desactive: true }),
              makeAction('te_1.3', { desactive: true }),
              makeAction('te_1.4', { desactive: true }),
              makeAction('te_1.5'),
            ],
          }),
        ],
      });

      const result = scoreSnapshotTreeToActionsWithGenealogyGroupedById(tree);

      expect(result['te_1.1'].nextId).toBe('te_1.5');
      expect(result['te_1.5'].previousId).toBe('te_1.1');
    });

    test('saute les actions désactivées au-delà des frontières de parent', () => {
      const tree = makeAction('te', {
        children: [
          makeAction('te_1', {
            children: [makeAction('te_1.1')],
          }),
          makeAction('te_2', {
            children: [
              makeAction('te_2.1', { desactive: true }),
              makeAction('te_2.2', { desactive: true }),
            ],
          }),
          makeAction('te_3', {
            children: [makeAction('te_3.1')],
          }),
        ],
      });

      const result = scoreSnapshotTreeToActionsWithGenealogyGroupedById(tree);

      expect(result['te_1.1'].nextId).toBe('te_3.1');
      expect(result['te_3.1'].previousId).toBe('te_1.1');
    });

    test('previousId / nextId valent null si tous les candidats sont désactivés', () => {
      const tree = makeAction('te', {
        children: [
          makeAction('te_1', {
            children: [
              makeAction('te_1.1', { desactive: true }),
              makeAction('te_1.2', { desactive: true }),
              makeAction('te_1.3'),
              makeAction('te_1.4', { desactive: true }),
            ],
          }),
        ],
      });

      const result = scoreSnapshotTreeToActionsWithGenealogyGroupedById(tree);

      expect(result['te_1.3']).toMatchObject({
        previousId: null,
        nextId: null,
      });
    });

    test('une action désactivée navigue elle aussi vers des candidats non désactivés', () => {
      const tree = makeAction('te', {
        children: [
          makeAction('te_1', {
            children: [
              makeAction('te_1.1'),
              makeAction('te_1.2', { desactive: true }),
              makeAction('te_1.3'),
            ],
          }),
        ],
      });

      const result = scoreSnapshotTreeToActionsWithGenealogyGroupedById(tree);

      expect(result['te_1.2']).toMatchObject({
        previousId: 'te_1.1',
        nextId: 'te_1.3',
      });
    });
  });

  describe('structure de généalogie', () => {
    test('parentId et childrenIds reflètent l’arbre', () => {
      const result = scoreSnapshotTreeToActionsWithGenealogyGroupedById(
        buildReferenceTree()
      );

      expect(result['eci_1']).toMatchObject({
        parentId: 'eci',
        childrenIds: ['eci_1.1', 'eci_1.2', 'eci_1.3'],
      });
      expect(result['eci_1.2']).toMatchObject({
        parentId: 'eci_1',
        childrenIds: [],
      });
    });

    test('childrenIds reste fidèle à l’arbre, même pour les enfants désactivés', () => {
      const tree = makeAction('eci', {
        children: [
          makeAction('eci_1', {
            children: [
              makeAction('eci_1.1'),
              makeAction('eci_1.2', { desactive: true }),
              makeAction('eci_1.3'),
            ],
          }),
        ],
      });

      const result = scoreSnapshotTreeToActionsWithGenealogyGroupedById(tree);

      expect(result['eci_1'].childrenIds).toEqual([
        'eci_1.1',
        'eci_1.2',
        'eci_1.3',
      ]);
    });
  });
});
