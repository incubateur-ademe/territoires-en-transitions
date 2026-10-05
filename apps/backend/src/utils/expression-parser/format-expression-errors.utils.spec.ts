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
        "Texte inattendu après la fin de l'expression : « inconnu ».",
      ].join('\n')
    );
  });

  it("n'affiche que la ligne fautive d'une formule sur plusieurs lignes", () => {
    expect(getErrorMessage(personnalisationsParser, CAE_6_AA_EXPR_CIBLE)).toBe(
      [
        '(ligne 7, colonne 10) :',
        '  sinon si dentite(sinoe, touristique) alors 300',
        '           ^^^^^^^',
        'Fonction inconnue « dentite ». Vouliez-vous dire « identite » ?',
      ].join('\n')
    );
  });

  it('ne garde pas le nom interne de l’exception dans le message', () => {
    expect(getErrorMessage(indicateurParser, 'min 1')).toBe(
      [
        '(ligne 1, colonne 5) :',
        '  min 1',
        '      ^',
        'Attendu « ( », trouvé « 1 ».',
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

describe('formatParsingErrors : fonction inconnue', () => {
  it('suggère la fonction la plus proche et place le curseur sous le nom', () => {
    expect(
      getErrorMessage(
        indicateurParser,
        'si dentite(sinoe, touristique) alors 300 sinon 380'
      )
    ).toBe(
      [
        '(ligne 1, colonne 4) :',
        '  si dentite(sinoe, touristique) alors 300 sinon 380',
        '     ^^^^^^^',
        'Fonction inconnue « dentite ». Vouliez-vous dire « identite » ?',
      ].join('\n')
    );
  });

  it("détecte un nom inconnu en tête d'expression", () => {
    expect(getErrorMessage(indicateurParser, 'vall(a)')).toBe(
      [
        '(ligne 1, colonne 1) :',
        '  vall(a)',
        '  ^^^^',
        'Fonction inconnue « vall ». Vouliez-vous dire « val » ?',
      ].join('\n')
    );
  });

  it('compare les noms en minuscules', () => {
    expect(getErrorMessage(indicateurParser, 'VAL(a)')).toContain(
      'Fonction inconnue « VAL ». Vouliez-vous dire « val » ?'
    );
  });

  it('ne suggère rien pour un nom court à distance 2', () => {
    const message = getErrorMessage(indicateurParser, 'moy(a)');
    expect(message).toContain('Fonction inconnue « moy ».');
    expect(message).not.toContain('Vouliez-vous dire');
  });

  it('liste les fonctions du DSL quand aucune n’est assez proche', () => {
    expect(getErrorMessage(indicateurParser, 'zzz(x)')).toContain(
      'Fonction inconnue « zzz ». Fonctions disponibles : val, opt_val, cible, limite, identite, reponse, est_suivi, progression_snbc, reduction, min, max.'
    );
    expect(getErrorMessage(personnalisationsParser, 'zzz(x)')).toContain(
      'Fonction inconnue « zzz ». Fonctions disponibles : identite, reponse, score, referentiel, demarche, min, max.'
    );
  });

  it('détecte un appel dans une condition', () => {
    expect(getErrorMessage(indicateurParser, 'si x(1) alors 2')).toContain(
      'Fonction inconnue « x ».'
    );
  });

  it('accepte une fonction commune aux deux DSL', () => {
    expect(() =>
      tokenizeAndParse(indicateurParser, 'identite(type, EPCI)')
    ).not.toThrow();
  });

  it('signale une fonction qui n’existe que dans l’autre DSL', () => {
    const message = getErrorMessage(indicateurParser, 'score(x)');
    expect(message).toContain('Fonction inconnue « score ».');
    expect(message).not.toContain('Vouliez-vous dire');
    expect(() =>
      tokenizeAndParse(personnalisationsParser, 'score(x)')
    ).not.toThrow();
  });

  it('ne traite pas comme un appel une parenthèse non collée', () => {
    expect(getErrorMessage(indicateurParser, 'si x (')).toBe(
      [
        '(ligne 1, colonne 6) :',
        '  si x (',
        '       ^',
        'Attendu « alors », trouvé « ( ».',
      ].join('\n')
    );
  });
});

describe('formatParsingErrors : messages en français', () => {
  it('nomme la fin de l’expression', () => {
    expect(getErrorMessage(indicateurParser, 'si x alors')).toContain(
      "trouvé la fin de l'expression."
    );
  });

  it('cite le texte en trop', () => {
    expect(getErrorMessage(indicateurParser, '1 2')).toContain(
      "Texte inattendu après la fin de l'expression : « 2 »."
    );
  });

  it('décrit le token attendu plutôt que son nom interne', () => {
    expect(getErrorMessage(indicateurParser, 'cible()')).toContain(
      'Attendu un identifiant, trouvé « ) ».'
    );
    expect(getErrorMessage(indicateurParser, '1 + * 2')).toContain(
      'Expression attendue, trouvé « * ».'
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
