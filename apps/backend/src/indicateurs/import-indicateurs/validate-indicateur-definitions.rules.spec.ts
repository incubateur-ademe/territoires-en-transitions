import { InvalidExpressionError } from '@tet/backend/utils/expression-parser';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { cloneDeep } from 'es-toolkit';
import { describe, expect, it, vi } from 'vitest';
import {
  sampleImportIndicateurDefinition,
  sampleImportIndicateurDefinition2,
} from './samples/import-indicateur-definition.sample';
import {
  ImportExpressionValidators,
  validateIndicateurDefinitions,
} from './validate-indicateur-definitions.rules';

const toValidators = ({
  sources = success([]),
  parsed = success(undefined),
}: {
  sources?: Result<readonly { identifiant: string }[], string>;
  parsed?: Result<unknown, string>;
} = {}): ImportExpressionValidators => ({
  indicateurs: {
    extractNeededSourceIndicateursFromFormula: vi.fn().mockReturnValue(sources),
    parseExpression: vi.fn().mockReturnValue(parsed),
  },
  personnalisations: { validateExpression: vi.fn() },
});

const toCalculatedDefinition = (valeurCalcule: string) => ({
  ...cloneDeep(sampleImportIndicateurDefinition2),
  valeurCalcule,
});

describe('validateIndicateurDefinitions, formules de calcul', () => {
  it('accepte une formule dont les sources existent avec la même périodicité', () => {
    const result = validateIndicateurDefinitions(
      [
        cloneDeep(sampleImportIndicateurDefinition),
        toCalculatedDefinition('val(cae_1.a) / 10'),
      ],
      toValidators({ sources: success([{ identifiant: 'cae_1.a' }]) })
    );

    expect(result).toEqual(success(undefined));
  });

  it("retourne l'échec d'extraction des sources avec le message de la cause", () => {
    const cause = new InvalidExpressionError('ligne 1 : jeton inattendu');

    const result = validateIndicateurDefinitions(
      [toCalculatedDefinition('val(')],
      toValidators({
        sources: failure('INVALID_EXPRESSION', cause),
      })
    );

    expect(result).toEqual(
      failure(
        'INVALID_EXPRESSION',
        new Error(
          "L'expression de calcul de l'indicateur cae_1.b est invalide ligne 1 : jeton inattendu"
        )
      )
    );
  });

  it("retourne l'échec d'analyse de la formule avec le code d'erreur quand il n'y a pas de cause", () => {
    const result = validateIndicateurDefinitions(
      [toCalculatedDefinition('val(cae_1.a)')],
      toValidators({
        sources: success([]),
        parsed: failure('INVALID_EXPRESSION'),
      })
    );

    expect(result).toEqual(
      failure(
        'INVALID_EXPRESSION',
        new Error(
          `L'expression de calcul de l'indicateur cae_1.b "val(cae_1.a)" est invalide : INVALID_EXPRESSION`
        )
      )
    );
  });

  it("refuse une formule qui dépend de l'indicateur lui-même", () => {
    const result = validateIndicateurDefinitions(
      [toCalculatedDefinition('val(cae_1.b)')],
      toValidators({ sources: success([{ identifiant: 'cae_1.b' }]) })
    );

    expect(result).toEqual(
      failure(
        'INVALID_EXPRESSION',
        new Error(
          `L'expression de calcul de l'indicateur cae_1.b "val(cae_1.b)" est invalide : Indicateur cae_1.b cannot depend on itself in formula`
        )
      )
    );
  });

  it('refuse une formule qui dépend d’un indicateur inconnu', () => {
    const result = validateIndicateurDefinitions(
      [toCalculatedDefinition('val(cae_9.z)')],
      toValidators({ sources: success([{ identifiant: 'cae_9.z' }]) })
    );

    expect(result).toEqual(
      failure(
        'INVALID_EXPRESSION',
        new Error(
          `L'expression de calcul de l'indicateur cae_1.b "val(cae_9.z)" est invalide : Indicateur cae_1.b depends on unknown indicateur cae_9.z`
        )
      )
    );
  });

  it('refuse une dépendance circulaire', () => {
    const first = {
      ...cloneDeep(sampleImportIndicateurDefinition),
      valeurCalcule: 'val(cae_1.b) / 10',
    };
    const second = toCalculatedDefinition('val(cae_1.a) * 10');
    const validators = toValidators();
    vi.mocked(
      validators.indicateurs.extractNeededSourceIndicateursFromFormula
    ).mockImplementation((formula) =>
      success([
        { identifiant: formula.includes('cae_1.b') ? 'cae_1.b' : 'cae_1.a' },
      ])
    );

    const result = validateIndicateurDefinitions([first, second], validators);

    expect(result).toEqual(
      failure(
        'INVALID_IMPORT',
        new Error(
          'Circular dependency detected in indicateur definitions: Dependency Cycle Found: cae_1.a -> cae_1.b -> cae_1.a'
        )
      )
    );
  });

  it("retourne l'échec d'analyse de la formule sans recopier la formule quand la cause est une erreur de syntaxe", () => {
    const cause = new InvalidExpressionError('ligne 1 : parenthèse manquante');

    const result = validateIndicateurDefinitions(
      [toCalculatedDefinition('val(cae_1.a')],
      toValidators({ parsed: failure('INVALID_EXPRESSION', cause) })
    );

    expect(result).toEqual(
      failure(
        'INVALID_EXPRESSION',
        new Error(
          "L'expression de calcul de l'indicateur cae_1.b est invalide ligne 1 : parenthèse manquante"
        )
      )
    );
  });

  it('refuse une formule qui dépend d’un indicateur de périodicité différente', () => {
    const monthlySource = {
      ...cloneDeep(sampleImportIndicateurDefinition),
      periodicite: 'mensuelle' as const,
    };

    const result = validateIndicateurDefinitions(
      [
        monthlySource,
        { ...toCalculatedDefinition('val(cae_1.a)'), parents: null },
      ],
      toValidators({ sources: success([{ identifiant: 'cae_1.a' }]) })
    );

    expect(result).toEqual(
      failure(
        'INVALID_EXPRESSION',
        new Error(
          `L'expression de calcul de l'indicateur cae_1.b "val(cae_1.a)" est invalide : Indicateur cae_1.b (annuelle) cannot depend on cae_1.a (mensuelle) with a different periodicite`
        )
      )
    );
  });

  it("retourne l'échec d'extraction avant les contrôles de source et l'analyse", () => {
    const validators = toValidators({
      sources: failure(
        'INVALID_EXPRESSION',
        new Error('extraction impossible')
      ),
    });

    const result = validateIndicateurDefinitions(
      [toCalculatedDefinition('val(cae_9.z)')],
      validators
    );

    expect(result).toEqual(
      failure(
        'INVALID_EXPRESSION',
        new Error(
          `L'expression de calcul de l'indicateur cae_1.b "val(cae_9.z)" est invalide : extraction impossible`
        )
      )
    );
    expect(validators.indicateurs.parseExpression).not.toHaveBeenCalled();
  });
});

describe('validateIndicateurDefinitions, expressions de personnalisation', () => {
  it('agrège les erreurs des expressions cible et seuil de toutes les définitions', () => {
    const validators = toValidators();
    vi.mocked(
      validators.personnalisations.validateExpression
    ).mockImplementation((expression) => {
      throw new Error(`syntaxe invalide : ${expression}`);
    });
    const first = {
      ...cloneDeep(sampleImportIndicateurDefinition),
      exprCible: 'cible_a',
      exprSeuil: 'seuil_a',
    };
    const second = {
      ...cloneDeep(sampleImportIndicateurDefinition2),
      exprCible: 'cible_b',
    };

    const result = validateIndicateurDefinitions([first, second], validators);

    expect(result).toEqual(
      failure(
        'INVALID_EXPRESSION',
        new Error(
          [
            `L'expression cible de l'indicateur cae_1.a "cible_a" est invalide : syntaxe invalide : cible_a`,
            `L'expression seuil de l'indicateur cae_1.a "seuil_a" est invalide : syntaxe invalide : seuil_a`,
            `L'expression cible de l'indicateur cae_1.b "cible_b" est invalide : syntaxe invalide : cible_b`,
          ].join('\n\n')
        )
      )
    );
  });
});
