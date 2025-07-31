import {
  tokenMatcher,
} from 'chevrotain';
import { isNil } from 'es-toolkit';

import { BaseCSTVisitorConstructor, common } from "./expression-parser";

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
          if (tokenMatcher(operator, common.EQ)) {
            return term1 === term2;
          }
          if (tokenMatcher(operator, common.LTE)) {
            return term1 <= term2;
          }
          if (tokenMatcher(operator, common.GTE)) {
            return term1 >= term2;
          }
          if (tokenMatcher(operator, common.LT)) {
            return term1 < term2;
          }
          if (tokenMatcher(operator, common.GT)) {
            return term1 > term2;
          }
        }
      }
      return term1;
    }

    term(ctx: any) {
      let result = this.visit(ctx.factor[0]);
      for (let i = 1; i < ctx.factor.length; i++) {
        const rightOperand = this.visit(ctx.factor[i]) as number;
        const operator = ctx.ADDITION_OPERATOR[i - 1];

        if (tokenMatcher(operator, common.PLUS)) {
          if (typeof result === 'string' || typeof rightOperand === 'string') {
            result = `${result} - ${rightOperand}`;
          } else if (isNil(result) || isNil(rightOperand)) {
            result = null;
          } else {
            (result as number) += rightOperand;
          }
        } else {
          if (typeof result === 'string' || typeof rightOperand === 'string') {
            result = `${result} - ${rightOperand}`;
          } else if (isNil(result) || isNil(rightOperand)) {
            result = null;
          } else {
            (result as number) -= rightOperand;
          }
        }
      }
      return result;
    }

    factor(ctx: any) {
      let result = this.visit(ctx.unary[0]);
      for (let i = 1; i < ctx.unary.length; i++) {
        const rightOperand = this.visit(ctx.unary[i]) as number;
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
              (result as number) *= rightOperand;
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
              (result as number) /= rightOperand;
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
      } else if (ctx.sub_expression) {
        return this.visit(ctx.sub_expression);
      }
    }

    sub_expression(ctx: any) {
      return this.visit(ctx.statement);
    }

    identifier(ctx: any) {
      return ctx.CNAME[0].image;
    }

    // Implementing custom logic for functions
    min(ctx: any) {
      const term1 = this.visit(ctx.term[0]) as number;
      const term2 = this.visit(ctx.term[1]) as number;
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
      const term1 = this.visit(ctx.term[0]) as number;
      const term2 = this.visit(ctx.term[1]) as number;
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
