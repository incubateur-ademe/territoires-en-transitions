import { HttpException } from '@nestjs/common';
import { parser as personnalisationsParser } from '@tet/backend/collectivites/personnalisations/services/personnalisations-expression.service';
import { parser as indicateurParser } from '@tet/backend/indicateurs/valeurs/indicateur-expression.service';
import { InvalidExpressionError } from './invalid-expression.error';
import { tokenizeAndParse } from './tokenize-and-parse';

function getError(fn: () => unknown): unknown {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error("L'appel n'a pas levé d'erreur");
}

describe('tokenizeAndParse', () => {
  it('lève une erreur sur un caractère non reconnu au lieu de le sauter', () => {
    const error = getError(() =>
      tokenizeAndParse(
        personnalisationsParser,
        'identite(sinoe, rural_dispersé)'
      )
    );
    expect(error).toBeInstanceOf(InvalidExpressionError);
    expect((error as Error).message).toBe('Caractère non reconnu « é » (1:30)');
  });

  it("signale le caractère inconnu plutôt qu'une erreur de parsing trompeuse", () => {
    const error = getError(() =>
      tokenizeAndParse(indicateurParser, 'val(a) % 2')
    );
    expect(error).toBeInstanceOf(InvalidExpressionError);
    expect((error as Error).message).toBe('Caractère non reconnu « % » (1:8)');
  });

  it('regroupe les caractères consécutifs non reconnus', () => {
    const error = getError(() =>
      tokenizeAndParse(indicateurParser, 'val(a) %% 2')
    );
    expect((error as Error).message).toBe('Caractère non reconnu « %% » (1:8)');
  });

  it('lève InvalidExpressionError, et non HttpException, sur une erreur de parsing', () => {
    const error = getError(() =>
      tokenizeAndParse(personnalisationsParser, 'si vrai alors')
    );
    expect(error).toBeInstanceOf(InvalidExpressionError);
    expect(error).not.toBeInstanceOf(HttpException);
  });

  it('parse une formule valide', () => {
    const cst = tokenizeAndParse(
      personnalisationsParser,
      'si identite(type, EPCI) alors 2 sinon 1'
    );
    expect(cst.name).toBe('statement');
    expect(personnalisationsParser.errors).toEqual([]);
  });
});
