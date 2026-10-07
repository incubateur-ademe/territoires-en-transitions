import {
  ActionDefinitionTag,
  ActionOrigine,
  ActionOrigineTexte,
  ActionTypeEnum,
  ReferentielDefinition,
  ReferentielIdEnum,
} from '@tet/domain/referentiels';
import {
  buildOrigineTags,
  parseActionsOrigine,
  parseActionsOrigineTexte,
} from './import-referentiel.service';

const refentielDefinitions: ReferentielDefinition[] = [
  {
    id: 'eci',
    nom: 'Economie circulaire',
    version: '1.0.0',
    hierarchie: [
      ActionTypeEnum.REFERENTIEL,
      ActionTypeEnum.AXE,
      ActionTypeEnum.ACTION,
      ActionTypeEnum.SOUS_ACTION,
      ActionTypeEnum.TACHE,
    ],
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    locked: false,
  },
  {
    id: 'cae',
    nom: 'Climat air energie',
    version: '1.0.0',
    hierarchie: [
      ActionTypeEnum.REFERENTIEL,
      ActionTypeEnum.AXE,
      ActionTypeEnum.SOUS_AXE,
      ActionTypeEnum.ACTION,
      ActionTypeEnum.SOUS_ACTION,
      ActionTypeEnum.TACHE,
    ],
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    locked: false,
  },
];

describe('ReferentielImportService', () => {
  describe('parseActionsOrigine', () => {
    it('Standard test without ponderation', async () => {
      const expectedCreateActionOrigines: ActionOrigine[] = [
        {
          actionId: 'te_3.5.4',
          origineActionId: 'eci_3.5.3.6',
          origineReferentielId: 'eci',
          ponderation: 1,
          referentielId: 'te',
        },
        {
          actionId: 'te_3.5.4',
          origineActionId: 'eci_3.5.4.2',
          origineReferentielId: 'eci',
          ponderation: 1,
          referentielId: 'te',
        },
      ];
      expect(
        parseActionsOrigine(
          ReferentielIdEnum.TE,
          'te_3.5.4',
          `Eci_3.5.3.6
Eci_3.5.4.2`,
          refentielDefinitions
        )
      ).toEqual(expectedCreateActionOrigines);
    });

    it('Standard test with ponderation', async () => {
      const expectedCreateActionOrigines: ActionOrigine[] = [
        {
          actionId: 'te_3.5.4',
          origineActionId: 'cae_5.1.4.4.1',
          origineReferentielId: 'cae',
          ponderation: 1,
          referentielId: 'te',
        },
        {
          actionId: 'te_3.5.4',
          origineActionId: 'cae_5.1.4.4.2',
          origineReferentielId: 'cae',
          ponderation: 0.5,
          referentielId: 'te',
        },
        {
          actionId: 'te_3.5.4',
          origineActionId: 'eci_1.3.2.4',
          origineReferentielId: 'eci',
          ponderation: 1,
          referentielId: 'te',
        },
      ];

      expect(
        parseActionsOrigine(
          ReferentielIdEnum.TE,
          'te_3.5.4',
          `Cae_5.1.4.4.1 (1)
Cae_5.1.4.4.2 (0,5)
Eci_1.3.2.4 (1)`,
          refentielDefinitions
        )
      ).toEqual(expectedCreateActionOrigines);
    });

    it('Invalid action id', async () => {
      expect(() =>
        parseActionsOrigine(
          ReferentielIdEnum.TE,
          'te_3.5.4',
          `Cae 5.1.4.4.1`,
          refentielDefinitions
        )
      ).toThrow('Invalid origine value cae 5.1.4.4.1 for action te_3.5.4');

      expect(() =>
        parseActionsOrigine(
          ReferentielIdEnum.TE,
          'te_3.5.4',
          `test_.1.4.4.1`,
          refentielDefinitions
        )
      ).toThrow('Invalid origine value test_.1.4.4.1 for action te_3.5.4');

      expect(() =>
        parseActionsOrigine(
          ReferentielIdEnum.TE,
          'te_3.5.4',
          `test_1.1.4.4.1 0.5`,
          refentielDefinitions
        )
      ).toThrow('Invalid origine value test_1.1.4.4.1 0.5 for action te_3.5.4');
    });

    it('Invalid action id referentiel', async () => {
      expect(() =>
        parseActionsOrigine(
          ReferentielIdEnum.TE,
          'te_3.5.4',
          `Ca_5.1.4.4.1`,
          refentielDefinitions
        )
      ).toThrow(
        'Invalid origine value referentiel ca_5.1.4.4.1 (referentiel ca) for action te_3.5.'
      );
    });

    it('Invalid ponderation', async () => {
      expect(() =>
        parseActionsOrigine(
          ReferentielIdEnum.TE,
          'te_3.5.4',
          `Cae_5.1.4.4.1 (zero)`,
          refentielDefinitions
        )
      ).toThrow(
        'Invalid ponderation value zero) for origine cae_5.1.4.4.1 (zero) of action te_3.5.4'
      );
    });
  });

  describe('parseActionsOrigineTexte', () => {
    it('Standard test without ponderation', async () => {
      const expected: ActionOrigineTexte[] = [
        {
          actionId: 'te_3.5.4',
          origineActionId: 'eci_3.5.3.6',
          origineReferentielId: 'eci',
          referentielId: 'te',
        },
        {
          actionId: 'te_3.5.4',
          origineActionId: 'eci_3.5.4.2',
          origineReferentielId: 'eci',
          referentielId: 'te',
        },
      ];
      expect(
        parseActionsOrigineTexte(
          ReferentielIdEnum.TE,
          'te_3.5.4',
          `Eci_3.5.3.6
Eci_3.5.4.2`,
          refentielDefinitions
        )
      ).toEqual(expected);
    });

    it('Drops the ponderation even when present in the source text', async () => {
      const expected: ActionOrigineTexte[] = [
        {
          actionId: 'te_3.5.4',
          origineActionId: 'cae_5.1.4.4.1',
          origineReferentielId: 'cae',
          referentielId: 'te',
        },
        {
          actionId: 'te_3.5.4',
          origineActionId: 'cae_5.1.4.4.2',
          origineReferentielId: 'cae',
          referentielId: 'te',
        },
      ];

      expect(
        parseActionsOrigineTexte(
          ReferentielIdEnum.TE,
          'te_3.5.4',
          `Cae_5.1.4.4.1 (1)
Cae_5.1.4.4.2 (0,5)`,
          refentielDefinitions
        )
      ).toEqual(expected);
    });

    it('Invalid action id', async () => {
      expect(() =>
        parseActionsOrigineTexte(
          ReferentielIdEnum.TE,
          'te_3.5.4',
          `Cae 5.1.4.4.1`,
          refentielDefinitions
        )
      ).toThrow('Invalid origine value cae 5.1.4.4.1 for action te_3.5.4');
    });

    it('New action prefix returns no entry', async () => {
      expect(
        parseActionsOrigineTexte(
          ReferentielIdEnum.TE,
          'te_3.5.4',
          `Nouvelle action`,
          refentielDefinitions
        )
      ).toEqual([]);
    });
  });

  describe('buildOrigineTags', () => {
    it('Deduplicates referentiel ids coming from both origine and origineTexte', () => {
      const expected: ActionDefinitionTag[] = [
        { referentielId: 'te', actionId: 'te_3.5.4', tagRef: 'cae' },
        { referentielId: 'te', actionId: 'te_3.5.4', tagRef: 'eci' },
      ];

      expect(
        buildOrigineTags(ReferentielIdEnum.TE, 'te_3.5.4', [
          'cae',
          'eci',
          'cae',
        ])
      ).toEqual(expected);
    });

    it('Returns an empty array when there is no origine referentiel', () => {
      expect(buildOrigineTags(ReferentielIdEnum.TE, 'te_3.5.4', [])).toEqual(
        []
      );
    });
  });
});
