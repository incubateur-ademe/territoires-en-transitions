import {
  ActionDefinitionTag,
  ReferentielIdEnum,
  ReferentielTag,
} from '@tet/domain/referentiels';
import {
  buildActionTags,
  buildReferentielTags,
} from './import-referentiel.service';

describe('ImportReferentielService', () => {
  describe('buildReferentielTags', () => {
    const builtinTagRefs = new Set(['cae', 'te_cae']);

    it('Maps the rows of the Tags sheet to referentiel tags, ignoring spaces', () => {
      const expected: ReferentielTag[] = [
        { ref: 'eau', nom: 'Eau', type: 'thematique' },
        { ref: 'qualite_air', nom: "Qualité de l'air", type: 'thematique' },
      ];

      expect(
        buildReferentielTags(
          [
            { id: 'eau', nom: 'Eau', type: 'thematique' },
            {
              id: ' qualite_air ',
              nom: " Qualité de l'air ",
              type: ' thematique ',
            },
          ],
          builtinTagRefs
        )
      ).toEqual({ referentielTags: expected, ignoredTagRefs: [] });
    });

    it('Ignores the builtin tags and the tags using a builtin type', () => {
      expect(
        buildReferentielTags(
          [
            { id: 'cae', nom: 'Autre nom', type: 'thematique' },
            { id: 'eau', nom: 'Eau', type: 'thematique' },
            { id: 'nouveau_label', nom: 'Nouveau label', type: ' Label ' },
            { id: 'nouveau_catalogue', nom: 'Catalogue', type: 'Catalogue' },
          ],
          builtinTagRefs
        )
      ).toEqual({
        referentielTags: [{ ref: 'eau', nom: 'Eau', type: 'thematique' }],
        ignoredTagRefs: ['cae', 'nouveau_label', 'nouveau_catalogue'],
      });
    });

    it('Throws on a missing type', () => {
      expect(() =>
        buildReferentielTags(
          [{ id: 'eau', nom: 'Eau', type: ' ' }],
          builtinTagRefs
        )
      ).toThrow('Tag eau is missing a type');
    });

    it('Throws on an unknown type', () => {
      expect(() =>
        buildReferentielTags(
          [{ id: 'eau', nom: 'Eau', type: 'Autre type' }],
          builtinTagRefs
        )
      ).toThrow(
        'Invalid type Autre type for tag eau, allowed values are: thematique'
      );
    });

    it('Throws on an empty id', () => {
      expect(() =>
        buildReferentielTags(
          [{ id: '  ', nom: 'Eau', type: 'thematique' }],
          builtinTagRefs
        )
      ).toThrow('A tag of the Tags sheet is missing an id');
    });

    it('Throws on a duplicated id', () => {
      expect(() =>
        buildReferentielTags(
          [
            { id: 'eau', nom: 'Eau', type: 'thematique' },
            { id: 'eau', nom: 'Eau (bis)', type: 'thematique' },
          ],
          builtinTagRefs
        )
      ).toThrow('Tag eau is duplicated in the spreadsheet');
    });
  });

  describe('buildActionTags', () => {
    const referentielTagRefs = new Set([
      'eau',
      'qualite_air',
      'biodiversite',
      'dechets',
    ]);

    it('Maps the tag ids to the action tags, ignoring spaces and duplicates', () => {
      const expected: ActionDefinitionTag[] = [
        { referentielId: 'te', actionId: 'te_1.1.1', tagRef: 'dechets' },
        { referentielId: 'te', actionId: 'te_1.1.1', tagRef: 'qualite_air' },
        { referentielId: 'te', actionId: 'te_1.1.1', tagRef: 'biodiversite' },
      ];

      expect(
        buildActionTags(
          ReferentielIdEnum.TE,
          'te_1.1.1',
          ['dechets', ' qualite_air ', 'biodiversite', 'dechets', ''],
          referentielTagRefs
        )
      ).toEqual(expected);
    });

    it('Throws on an id missing from the Tags sheet', () => {
      expect(() =>
        buildActionTags(
          ReferentielIdEnum.TE,
          'te_1.1.1',
          ['eau', 'sols'],
          referentielTagRefs
        )
      ).toThrow(
        'Invalid tag sols for action te_1.1.1, allowed values are: eau, qualite_air, biodiversite, dechets'
      );
    });
  });
});
