/**
 * Tokens et classe de base pour le parsing d'expression
 */

import {
  createToken,
  CstParser,
  Lexer,
  tokenMatcher,
  TokenType,
} from 'chevrotain';
import { isNil } from 'es-toolkit';

const VRAI = createToken({ name: 'VRAI', pattern: /vrai/i });
const FAUX = createToken({ name: 'FAUX', pattern: /faux/i });
const OUI = createToken({ name: 'OUI', pattern: /oui/i });
const NON = createToken({ name: 'NON', pattern: /non/i });

const CNAME = createToken({
  name: 'CNAME',
  pattern: /[a-zA-Z_][a-zA-Z_0-9.]*/,
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

export class ExpressionParserBase extends CstParser {
  readonly lexer;

  constructor(tokens: TokenType[]) {
    const allTokens = [...tokens, ...baseTokens];
    super(allTokens);
    this.lexer = new Lexer(allTokens);
  }

  // Statement
  protected statement = this.RULE('statement', () => {
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
      { ALT: () => this.CONSUME(VRAI) },
      { ALT: () => this.CONSUME(FAUX) },
      { ALT: () => this.CONSUME(OUI) },
      { ALT: () => this.CONSUME(NON) },
      { ALT: () => this.CONSUME(CNAME) },
      { ALT: () => this.CONSUME(NUMBER) },
    ]);
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

type BaseCSTVisitorConstructor = ReturnType<
  ExpressionParserBase['getBaseCstVisitorConstructor']
>;

export function getExpressionVisitor<T extends BaseCSTVisitorConstructor>(
  SuperClass: T
) {
  return class extends SuperClass {
    statement(ctx: any) {
      if (ctx.if_statement) {
        return this.visit(ctx.if_statement);
      } else if (ctx.comp_statement) {
        return this.visit(ctx.comp_statement);
      } else {
        return this.visit(ctx.expression);
      }
    }

    if_statement(ctx: any) {
      const condition = this.visit(ctx.expression);
      const thenBranch = this.visit(ctx.statement[0]);
      const elseBranch = ctx.statement[1] ? this.visit(ctx.statement[1]) : null;
      return condition ? thenBranch : elseBranch;
    }

    expression(ctx: any) {
      return this.visit(ctx.logic_or);
    }

    logic_or(ctx: any) {
      let result = this.visit(ctx.logic_and[0]);
      for (let i = 1; i < ctx.logic_and.length; i++) {
        const nextValue = this.visit(ctx.logic_and[i]);
        result = result || nextValue;
      }
      return result;
    }

    logic_and(ctx: any) {
      let result = this.visit(ctx.compare[0]);
      for (let i = 1; i < ctx.compare.length; i++) {
        const nextValue = this.visit(ctx.compare[i]);
        result = result && nextValue;
      }
      return result;
    }

    compare(ctx: any) {
      const term1 = this.visit(ctx.term[0]) as number;
      const operator = ctx.COMP_OPERATOR?.[0];
      if (operator && ctx.term.length > 1) {
        const term2 = this.visit(ctx.term[1]) as number;
        if (typeof term1 === 'string' || typeof term2 === 'string') {
          return `${term1} ${operator} ${term2}`;
        } else if (isNil(term1) || isNil(term2)) {
          return null;
        } else {
          if (tokenMatcher(operator, EQ)) {
            return term1 === term2;
          }
          if (tokenMatcher(operator, LTE)) {
            return term1 <= term2;
          }
          if (tokenMatcher(operator, GTE)) {
            return term1 >= term2;
          }
          if (tokenMatcher(operator, LT)) {
            return term1 < term2;
          }
          if (tokenMatcher(operator, GT)) {
            return term1 > term2;
          }
        }
      }
      return term1;
    }

    term(ctx: any) {
      let result = this.visit(ctx.factor[0]);
      for (let i = 1; i < ctx.factor.length; i++) {
        const rightOperand = this.visit(ctx.factor[i]);
        const operator = ctx.ADDITION_OPERATOR[i - 1];

        if (tokenMatcher(operator, common.PLUS)) {
          if (typeof result === 'string' || typeof rightOperand === 'string') {
            result = `${result} - ${rightOperand}`;
          } else if (isNil(result) || isNil(rightOperand)) {
            result = null;
          } else {
            result += rightOperand;
          }
        } else {
          if (typeof result === 'string' || typeof rightOperand === 'string') {
            result = `${result} - ${rightOperand}`;
          } else if (isNil(result) || isNil(rightOperand)) {
            result = null;
          } else {
            result -= rightOperand;
          }
        }
      }
      return result;
    }

    factor(ctx: any) {
      let result = this.visit(ctx.unary[0]);
      for (let i = 1; i < ctx.unary.length; i++) {
        const rightOperand = this.visit(ctx.unary[i]);
        const operator = ctx.MULTIPLICATION_OPERATOR
          ? ctx.MULTIPLICATION_OPERATOR[i - 1]
          : null;
        if (operator) {
          if (tokenMatcher(operator, common.MULT)) {
            if (
              typeof result === 'string' ||
              typeof rightOperand === 'string'
            ) {
              result = `${result} * ${rightOperand}`;
            } else if (isNil(result) || isNil(rightOperand)) {
              result = null;
            } else {
              result *= rightOperand;
            }
          } else if (tokenMatcher(operator, common.DIV)) {
            if (
              typeof result === 'string' ||
              typeof rightOperand === 'string'
            ) {
              result = `${result} / ${rightOperand}`;
            } else if (isNil(result) || isNil(rightOperand)) {
              result = null;
            } else {
              result /= rightOperand;
            }
          }
        }
      }
      return result;
    }

    unary(ctx: any) {
      return this.visit(ctx.call);
    }

    call(ctx: any) {
      if (ctx.primary) {
        return this.visit(ctx.primary);
      } else if (ctx.min) {
        return this.visit(ctx.min);
      } else if (ctx.max) {
        return this.visit(ctx.max);
      }
      throw new Error(
        'Unsupported function call. Catch this error into super class and implement custom handler.'
      );
    }

    primary(ctx: any) {
      if (ctx.VRAI) {
        return true;
      } else if (ctx.FAUX) {
        return false;
      } else if (ctx.OUI) {
        return true;
      } else if (ctx.NON) {
        return false;
      } else if (ctx.CNAME) {
        return ctx.CNAME[0].image; // Assuming string identifier
      } else if (ctx.NUMBER) {
        return parseFloat(ctx.NUMBER[0].image);
      }
    }

    identifier(ctx: any) {
      return ctx.CNAME[0].image;
    }

    // Implementing custom logic for functions
    min(ctx: any) {
      const term1 = this.visit(ctx.term[0]);
      const term2 = this.visit(ctx.term[1]);
      if (typeof term1 === 'string' || typeof term2 === 'string') {
        // TODO: done in order to verify unit test, check if needed
        return `min(${term1}, ${term2})`;
      } else if (isNil(term1) || isNil(term2)) {
        return null;
      } else {
        return Math.min(term1, term2);
      }
    }

    max(ctx: any) {
      const term1 = this.visit(ctx.term[0]);
      const term2 = this.visit(ctx.term[1]);
      if (typeof term1 === 'string' || typeof term2 === 'string') {
        // TODO: done in order to verify unit test, check if needed
        return `max(${term1}, ${term2})`;
      } else if (isNil(term1) || isNil(term2)) {
        return null;
      } else {
        return Math.max(term1, term2);
      }
    }
  };
}


