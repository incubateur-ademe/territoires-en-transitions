/**
 * Tokens et classe de base pour le parsing d'expression
 */

import { createToken, CstParser, Lexer, TokenType } from 'chevrotain';

const VRAI = createToken({ name: 'VRAI', pattern: /vrai/i });
const FAUX = createToken({ name: 'FAUX', pattern: /faux/i });
const OUI = createToken({ name: 'OUI', pattern: /oui/i });
const NON = createToken({ name: 'NON', pattern: /non/i });

const CNAME = createToken({
  name: 'CNAME',
  pattern: /[a-zA-Z_][a-zA-Z_0-9.-]*/,
});
const NUMBER = createToken({ name: 'NUMBER', pattern: /-?\d+(\.\d+)?/ });

const SI = createToken({ name: 'SI', pattern: /si/i });
const ALORS = createToken({ name: 'ALORS', pattern: /alors/i });
const SINON = createToken({ name: 'SINON', pattern: /sinon/i });

const MIN = createToken({ name: 'MIN', pattern: /min/i });
const MAX = createToken({ name: 'MAX', pattern: /max/i });

const OU = createToken({ name: 'OU', pattern: /ou/i });
const ET = createToken({ name: 'ET', pattern: /et/i });

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

export class ExpressionParser extends CstParser {
  readonly lexer;

  constructor(tokens: TokenType[]) {
    const allTokens = [...tokens, ...baseTokens];
    super(allTokens);
    this.lexer = new Lexer(allTokens);
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
