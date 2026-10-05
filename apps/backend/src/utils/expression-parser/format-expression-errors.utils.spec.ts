import { parser as personnalisationsParser } from '@tet/backend/collectivites/personnalisations/services/personnalisations-expression.service';
import { parser as indicateurParser } from '@tet/backend/indicateurs/valeurs/indicateur-expression.service';
import { ExpressionParser } from './expression-parser';
import { formatParsingErrors } from './format-expression-errors.utils';
import { tokenizeAndParse } from './tokenize-and-parse';

function getErrorMessage(parser: ExpressionParser, source: string): string {
  try {
    tokenizeAndParse(parser, source);
  } catch (error) {
    return (error as Error).message;
  }
  throw new Error("L'appel n'a pas levé d'erreur");
}

const CAE_6_AA_EXPR_CIBLE = [
  'si referentiel(te) alors (',
  'si identite(sinoe, dense) alors 280',
  'sinon si identite(sinoe, intermediaire) alors 300',
  'sinon si identite(sinoe, rural) alors 320',
  'sinon si identite(sinoe, rural_disperse) alors 340',
  'sinon si identite(sinoe, urbain) alors 290',
  'sinon si dentite(sinoe, touristique) alors 300',
  'sinon 360',
  ') sinon (',
  'si identite(sinoe, dense) alors 260',
  'sinon 380',
  ')',
].join('\n');

describe('formatParsingErrors', () => {
  it("affiche l'extrait et le curseur d'une formule d'une seule ligne", () => {
    expect(getErrorMessage(personnalisationsParser, 'vrai inconnu')).toBe(
      [
        '(ligne 1, colonne 6) :',
        '  vrai inconnu',
        '       ^^^^^^^',
        'NotAllInputParsedException: Redundant input, expecting EOF but found: inconnu',
      ].join('\n')
    );
  });

  it("n'affiche que la ligne fautive d'une formule sur plusieurs lignes", () => {
    expect(getErrorMessage(personnalisationsParser, CAE_6_AA_EXPR_CIBLE)).toBe(
      [
        '(ligne 7, colonne 17) :',
        '  sinon si dentite(sinoe, touristique) alors 300',
        '                  ^',
        "MismatchedTokenException: Expecting token of type --> ALORS <-- but found --> '(' <--",
      ].join('\n')
    );
  });

  it("place le curseur juste après le dernier token quand l'expression est incomplète", () => {
    const message = getErrorMessage(personnalisationsParser, 'si vrai alors');
    expect(message.split('\n').slice(0, 3)).toEqual([
      '(ligne 1, colonne 14) :',
      '  si vrai alors',
      '               ^',
    ]);
  });

  it('garde les tabulations devant le curseur pour conserver l’alignement', () => {
    const message = getErrorMessage(
      personnalisationsParser,
      'si vrai alors 1\n\tsinon 2 3'
    );
    expect(message.split('\n').slice(0, 3)).toEqual([
      '(ligne 2, colonne 10) :',
      '  \tsinon 2 3',
      '  \t        ^',
    ]);
  });

  it('renvoie un message de repli sans erreur', () => {
    expect(formatParsingErrors([], { source: 'vrai' })).toBe(
      'Expression invalide'
    );
  });
});

describe('formatLexingErrors', () => {
  it('place le curseur sous le caractère non reconnu', () => {
    expect(
      getErrorMessage(
        personnalisationsParser,
        'identite(sinoe, rural_dispersé)'
      )
    ).toBe(
      [
        '(ligne 1, colonne 30) :',
        '  identite(sinoe, rural_dispersé)',
        '                               ^',
        'Caractère non reconnu « é »',
      ].join('\n')
    );
  });

  it('souligne toute la longueur des caractères consécutifs non reconnus', () => {
    expect(getErrorMessage(indicateurParser, 'val(a) %% 2')).toBe(
      [
        '(ligne 1, colonne 8) :',
        '  val(a) %% 2',
        '         ^^',
        'Caractère non reconnu « %% »',
      ].join('\n')
    );
  });

  it('produit un bloc par caractère non reconnu', () => {
    expect(getErrorMessage(indicateurParser, 'val(a) % 2\n+ val(b) % 3')).toBe(
      [
        '(ligne 1, colonne 8) :',
        '  val(a) % 2',
        '         ^',
        'Caractère non reconnu « % »',
        '(ligne 2, colonne 10) :',
        '  + val(b) % 3',
        '           ^',
        'Caractère non reconnu « % »',
      ].join('\n')
    );
  });
});
