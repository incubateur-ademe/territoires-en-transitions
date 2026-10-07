/**
 * Tokens et classe de base pour le parsing d'expression
 */

import { createToken, CstParser, Lexer, TokenType } from 'chevrotain';
import { parserErrorMessageProvider } from './parser-error-message-provider';

const CNAME = createToken({
  name: 'CNAME',
  pattern: /[a-zA-Z_][a-zA-Z_0-9.-]*/,
});
const NUMBER = createToken({ name: 'NUMBER', pattern: /-?\d+(\.\d+)?/ });

/**
 * Crée un mot-clé du DSL. Le lexer retient le premier token qui matche : sans
 * `longer_alt`, un identifiant qui commence par un mot-clé (`sinoe`, `ouvert`,
 * `minimum`…) serait coupé en deux. Avec, le mot-clé ne l'emporte que s'il
 * couvre tout l'identifiant.
 */
export function createKeywordToken(name: string, pattern: RegExp): TokenType {
  return createToken({ name, pattern, longer_alt: CNAME });
}

const VRAI = createKeywordToken('VRAI', /vrai/i);
const FAUX = createKeywordToken('FAUX', /faux/i);
const OUI = createKeywordToken('OUI', /oui/i);
const NON = createKeywordToken('NON', /non/i);

const SI = createKeywordToken('SI', /si/i);
const ALORS = createKeywordToken('ALORS', /alors/i);
const SINON = createKeywordToken('SINON', /sinon/i);

const MIN = createKeywordToken('MIN', /min/i);
const MAX = createKeywordToken('MAX', /max/i);

const OU = createKeywordToken('OU', /ou/i);
const ET = createKeywordToken('ET', /et/i);

const ADDITION_OPERATOR = createToken({
  name: 'ADDITION_OPERATOR',
  pattern: Lexer.NA,
});

const PLUS = createToken({
  name: 'PLUS',
  pattern: /\+/,
  categories: ADDITION_OPERATOR,
});

const MINUS = createToken({
  name: 'MINUS',
  pattern: /-/,
  categories: ADDITION_OPERATOR,
});

const MULTIPLICATION_OPERATOR = createToken({
  name: 'MULTIPLICATION_OPERATOR',
  pattern: Lexer.NA,
});
const MULT = createToken({
  name: 'MULT',
  pattern: /\*/,
  categories: MULTIPLICATION_OPERATOR,
});
const DIV = createToken({
  name: 'DIV',
  pattern: /\//,
  categories: MULTIPLICATION_OPERATOR,
});

const COMP_OPERATOR = createToken({
  name: 'COMP_OPERATOR',
  pattern: Lexer.NA,
});
const EQ = createToken({
  name: 'EQ',
  pattern: /=/,
  categories: COMP_OPERATOR,
});
const LTE = createToken({
  name: 'LTE',
  pattern: /<=/,
  categories: COMP_OPERATOR,
});
const GTE = createToken({
  name: 'GTE',
  pattern: />=/,
  categories: COMP_OPERATOR,
});
const LT = createToken({
  name: 'LT',
  pattern: /</,
  categories: COMP_OPERATOR,
});
const GT = createToken({
  name: 'GT',
  pattern: />/,
  categories: COMP_OPERATOR,
});

const LPAR = createToken({ name: 'LPAR', pattern: /\(/ });
const RPAR = createToken({ name: 'RPAR', pattern: /\)/ });
const COMMA = createToken({ name: 'COMMA', pattern: /,/ });

// Whitespace to be skipped
const WS = createToken({
  name: 'WS',
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});

export const common = {
  WS,
  VRAI,
  FAUX,
  OUI,
  NON,
  SINON,
  SI,
  ALORS,
  MIN,
  MAX,
  OU,
  ET,
  PLUS,
  MINUS,
  ADDITION_OPERATOR,
  MULT,
  DIV,
  MULTIPLICATION_OPERATOR,
  EQ,
  LTE,
  GTE,
  LT,
  GT,
  COMP_OPERATOR,
  LPAR,
  RPAR,
  COMMA,
  CNAME,
  NUMBER,
};

const baseTokens = Object.values(common);

/**
 * Noms des fonctions tels qu'on les écrit, à partir du nom de leurs tokens
 * (`OPT_VAL` → `opt_val`). Les motifs ne conviennent pas : ils ne portent pas
 * tous le flag `i`.
 */
export function getFunctionNames(functionTokens: TokenType[]): string[] {
  return functionTokens.map((token) => token.name.toLowerCase());
}

export class ExpressionParser extends CstParser {
  readonly lexer;

  // fonctions connues du dialecte, suivies de celles du parser de base
  readonly functionNames: readonly string[];

  constructor(tokens: TokenType[], functionNames: readonly string[]) {
    const allTokens = [...tokens, ...baseTokens];
    super(allTokens, { errorMessageProvider: parserErrorMessageProvider });
    this.lexer = new Lexer(allTokens);
    this.functionNames = [...functionNames, ...getFunctionNames([MIN, MAX])];
  }

  // Statement
  statement = this.RULE('statement', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.if_statement) },
      { ALT: () => this.SUBRULE(this.expression) },
    ]);
  });

  // If Statement
  protected if_statement = this.RULE('if_statement', () => {
    this.CONSUME(SI);
    this.SUBRULE(this.expression);
    this.CONSUME(ALORS);
    this.SUBRULE(this.statement);
    this.OPTION(() => {
      this.CONSUME(SINON);
      this.SUBRULE2(this.statement);
    });
  });

  // Expression
  protected expression = this.RULE('expression', () => {
    this.SUBRULE(this.logic_or);
  });

  // Logic OR
  protected logic_or = this.RULE('logic_or', () => {
    this.SUBRULE(this.logic_and);
    this.MANY(() => {
      this.CONSUME(OU);
      this.SUBRULE2(this.logic_and);
    });
  });

  // Logic AND
  protected logic_and = this.RULE('logic_and', () => {
    this.SUBRULE(this.compare);
    this.MANY(() => {
      this.CONSUME(ET);
      this.SUBRULE2(this.compare);
    });
  });

  protected compare = this.RULE('compare', () => {
    this.SUBRULE(this.term);
    this.MANY(() => {
      this.CONSUME(COMP_OPERATOR);
      this.SUBRULE2(this.term);
    });
  });

  // Term
  protected term = this.RULE('term', () => {
    this.SUBRULE(this.factor);
    this.MANY(() => {
      // consuming 'AdditionOperator' will consume either Plus or Minus as they are subclasses of AdditionOperator
      this.CONSUME(ADDITION_OPERATOR);
      this.SUBRULE2(this.factor);
    });
  });

  // Factor
  protected factor = this.RULE('factor', () => {
    this.SUBRULE(this.unary);
    this.MANY(() => {
      this.CONSUME(MULTIPLICATION_OPERATOR);
      this.SUBRULE2(this.unary);
    });
  });

  // Unary
  protected unary = this.RULE('unary', () => {
    this.SUBRULE(this.call);
  });

  getCallHandlers = () => [
    { ALT: () => this.SUBRULE(this.primary) },
    { ALT: () => this.SUBRULE(this.min) },
    { ALT: () => this.SUBRULE(this.max) },
  ];

  protected call = this.RULE('call', () => {
    this.OR(this.getCallHandlers());
  });

  protected min = this.RULE('min', () => {
    this.consumeFuncTwoTerms(MIN);
  });

  protected max = this.RULE('max', () => {
    this.consumeFuncTwoTerms(MAX);
  });

  // Primary
  protected primary = this.RULE('primary', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.sub_expression) },
      { ALT: () => this.CONSUME(VRAI) },
      { ALT: () => this.CONSUME(FAUX) },
      { ALT: () => this.CONSUME(OUI) },
      { ALT: () => this.CONSUME(NON) },
      { ALT: () => this.CONSUME(CNAME) },
      { ALT: () => this.CONSUME(NUMBER) },
    ]);
  });

  protected sub_expression = this.RULE('sub_expression', () => {
    this.CONSUME(LPAR);
    this.SUBRULE(this.statement);
    this.CONSUME(RPAR);
  });

  // Identifier
  protected identifier = this.RULE('identifier', () => {
    this.CONSUME(CNAME);
  });

  protected consumeFuncOneParam = (token: TokenType) => {
    this.CONSUME(token);
    this.CONSUME(common.LPAR);
    this.SUBRULE(this.identifier);
    this.CONSUME(common.RPAR);
  };

  protected consumeFuncTwoParams = (token: TokenType) => {
    this.CONSUME(token);
    this.CONSUME(common.LPAR);
    this.SUBRULE(this.identifier);
    this.CONSUME(common.COMMA);
    this.SUBRULE2(this.primary);
    this.CONSUME(common.RPAR);
  };

  protected consumeFuncTwoParamsLastOptional = (token: TokenType) => {
    this.CONSUME(token);
    this.CONSUME(common.LPAR);
    this.SUBRULE(this.identifier);
    this.OPTION(() => {
      this.CONSUME(common.COMMA);
      this.SUBRULE2(this.primary);
    });
    this.CONSUME(common.RPAR);
  };

  protected consumeFuncFourParams = (token: TokenType) => {
    this.CONSUME(token);
    this.CONSUME(common.LPAR);
    this.SUBRULE(this.identifier);
    this.CONSUME(common.COMMA);
    this.SUBRULE2(this.primary);
    this.CONSUME2(common.COMMA);
    this.SUBRULE3(this.primary);
    this.CONSUME3(common.COMMA);
    this.SUBRULE4(this.primary);
    this.CONSUME(common.RPAR);
  };

  protected consumeFuncTwoTerms = (token: TokenType) => {
    this.CONSUME(token);
    this.CONSUME(LPAR);
    this.SUBRULE(this.term);
    this.CONSUME(COMMA);
    this.SUBRULE2(this.term);
    this.CONSUME(RPAR);
  };
}

export type BaseCSTVisitorConstructor = ReturnType<
  ExpressionParser['getBaseCstVisitorConstructor']
>;
