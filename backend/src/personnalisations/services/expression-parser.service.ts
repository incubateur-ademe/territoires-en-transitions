import { HttpException, Injectable, Logger } from '@nestjs/common';
import { createToken, CstParser, Lexer, tokenMatcher } from 'chevrotain';
import * as _ from 'lodash';
import { IdentiteCollectivite } from '../../collectivites/models/collectivite.models';

// Define all the tokens used in the grammar
const VRAI = createToken({ name: 'VRAI', pattern: /VRAI/ });
const FAUX = createToken({ name: 'FAUX', pattern: /FAUX/ });
const vrai = createToken({ name: 'vrai', pattern: /vrai/ });
const faux = createToken({ name: 'faux', pattern: /faux/ });
const OUI = createToken({ name: 'OUI', pattern: /OUI/ });
const NON = createToken({ name: 'NON', pattern: /NON/ });
const oui = createToken({ name: 'oui', pattern: /oui/ });
const non = createToken({ name: 'non', pattern: /non/ });

const CNAME = createToken({
  name: 'CNAME',
  pattern: /[a-zA-Z_][a-zA-Z_0-9\.]*/,
});
const NUMBER = createToken({ name: 'NUMBER', pattern: /-?\d+(\.\d+)?/ });

const SI = createToken({ name: 'SI', pattern: /si/ });
const ALORS = createToken({ name: 'ALORS', pattern: /alors/ });
const SINON = createToken({ name: 'SINON', pattern: /sinon/ });

const IDENTITE = createToken({ name: 'IDENTITE', pattern: /identite/ });
const REPONSE = createToken({ name: 'REPONSE', pattern: /reponse/ });
const SCORE = createToken({ name: 'SCORE', pattern: /score/ });
const MIN = createToken({ name: 'MIN', pattern: /min/ });
const MAX = createToken({ name: 'MAX', pattern: /max/ });

const OU = createToken({ name: 'OU', pattern: /ou/ });
const ET = createToken({ name: 'ET', pattern: /et/ });

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

const LPAR = createToken({ name: 'LPAR', pattern: /\(/ });
const RPAR = createToken({ name: 'RPAR', pattern: /\)/ });
const COMMA = createToken({ name: 'COMMA', pattern: /,/ });

// Whitespace to be skipped
const WS = createToken({ name: 'WS', pattern: /\s+/, group: Lexer.SKIPPED });

// All tokens
const allTokens = [
  WS,
  VRAI,
  FAUX,
  vrai,
  faux,
  OUI,
  NON,
  oui,
  non,
  SINON,
  SI,
  ALORS,
  IDENTITE,
  REPONSE,
  SCORE,
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
  LPAR,
  RPAR,
  COMMA,
  CNAME,
  NUMBER,
];

const exprLexer = new Lexer(allTokens);

class ExprParser extends CstParser {
  constructor() {
    super(allTokens);
    this.performSelfAnalysis();
  }

  // Statement
  public statement = this.RULE('statement', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.if_statement) },
      { ALT: () => this.SUBRULE(this.expression) },
    ]);
  });

  // If Statement
  private if_statement = this.RULE('if_statement', () => {
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
  private expression = this.RULE('expression', () => {
    this.SUBRULE(this.logic_or);
  });

  // Logic OR
  private logic_or = this.RULE('logic_or', () => {
    this.SUBRULE(this.logic_and);
    this.MANY(() => {
      this.CONSUME(OU);
      this.SUBRULE2(this.logic_and);
    });
  });

  // Logic AND
  private logic_and = this.RULE('logic_and', () => {
    this.SUBRULE(this.term);
    this.MANY(() => {
      this.CONSUME(ET);
      this.SUBRULE2(this.term);
    });
  });

  // Term
  private term = this.RULE('term', () => {
    this.SUBRULE(this.factor);
    this.MANY(() => {
      // consuming 'AdditionOperator' will consume either Plus or Minus as they are subclasses of AdditionOperator
      this.CONSUME(ADDITION_OPERATOR);
      this.SUBRULE2(this.factor);
    });
  });

  // Factor
  private factor = this.RULE('factor', () => {
    this.SUBRULE(this.unary);
    this.MANY(() => {
      this.CONSUME(MULTIPLICATION_OPERATOR);
      this.SUBRULE2(this.unary);
    });
  });

  // Unary
  private unary = this.RULE('unary', () => {
    this.SUBRULE(this.call);
  });

  private call = this.RULE('call', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.identite) },
      { ALT: () => this.SUBRULE(this.primary) },
      { ALT: () => this.SUBRULE(this.reponse) },
      { ALT: () => this.SUBRULE(this.min) },
      { ALT: () => this.SUBRULE(this.max) },
      { ALT: () => this.SUBRULE(this.score) },
    ]);
  });

  private identite = this.RULE('identite', () => {
    this.CONSUME(IDENTITE);
    this.CONSUME(LPAR);
    this.SUBRULE(this.identifier);
    this.CONSUME(COMMA);
    this.SUBRULE2(this.primary);
    this.CONSUME(RPAR);
  });

  private reponse = this.RULE('reponse', () => {
    this.CONSUME(REPONSE);
    this.CONSUME(LPAR);
    this.SUBRULE(this.identifier);
    this.OPTION(() => {
      this.CONSUME(COMMA);
      this.SUBRULE2(this.primary);
    });
    this.CONSUME(RPAR);
  });

  private min = this.RULE('min', () => {
    this.CONSUME(MIN);
    this.CONSUME(LPAR);
    this.SUBRULE(this.term);
    this.CONSUME(COMMA);
    this.SUBRULE2(this.term);
    this.CONSUME(RPAR);
  });

  private max = this.RULE('max', () => {
    this.CONSUME(MAX);
    this.CONSUME(LPAR);
    this.SUBRULE(this.term);
    this.CONSUME(COMMA);
    this.SUBRULE2(this.term);
    this.CONSUME(RPAR);
  });

  private score = this.RULE('score', () => {
    this.CONSUME(SCORE);
    this.CONSUME(LPAR);
    this.SUBRULE(this.identifier);
    this.CONSUME(RPAR);
  });

  // Primary
  private primary = this.RULE('primary', () => {
    this.OR([
      { ALT: () => this.CONSUME(VRAI) },
      { ALT: () => this.CONSUME(FAUX) },
      { ALT: () => this.CONSUME(vrai) },
      { ALT: () => this.CONSUME(faux) },
      { ALT: () => this.CONSUME(OUI) },
      { ALT: () => this.CONSUME(NON) },
      { ALT: () => this.CONSUME(oui) },
      { ALT: () => this.CONSUME(non) },
      { ALT: () => this.CONSUME(CNAME) },
      { ALT: () => this.CONSUME(NUMBER) },
    ]);
  });

  // Identifier
  private identifier = this.RULE('identifier', () => {
    this.CONSUME(CNAME);
  });
}

const parser = new ExprParser();

const BaseCSTVisitor = parser.getBaseCstVisitorConstructor();

class CollectiviteExpressionVisitor extends BaseCSTVisitor {
  reponses: { [key: string]: boolean | number | string | null } | null = null;
  identiteCollectivite: IdentiteCollectivite | null = null;
  scores: { [key: string]: number } | null = null;

  constructor() {
    super();
    this.validateVisitor();
  }

  statement(ctx: any) {
    if (ctx.if_statement) {
      return this.visit(ctx.if_statement);
    } else {
      return this.visit(ctx.expression);
    }
  }

  if_statement(ctx: any) {
    const condition = this.visit(ctx.expression);
    const thenBranch = this.visit(ctx.statement[0]);
    const elseBranch = ctx.statement[1] ? this.visit(ctx.statement[1]) : null;

    if (condition) {
      return thenBranch;
    } else {
      return elseBranch;
    }
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
    let result = this.visit(ctx.term[0]);
    for (let i = 1; i < ctx.term.length; i++) {
      const nextValue = this.visit(ctx.term[i]);
      result = result && nextValue;
    }
    return result;
  }

  term(ctx: any) {
    let result = this.visit(ctx.factor[0]);
    for (let i = 1; i < ctx.factor.length; i++) {
      const rightOperand = this.visit(ctx.factor[i]);
      const operator = ctx.ADDITION_OPERATOR[i - 1];

      if (tokenMatcher(operator, PLUS)) {
        if (typeof result === 'string' || typeof rightOperand === 'string') {
          result = `${result} - ${rightOperand}`;
        } else if (_.isNil(result) || _.isNil(rightOperand)) {
          result = null;
        } else {
          result += rightOperand;
        }
      } else {
        if (typeof result === 'string' || typeof rightOperand === 'string') {
          result = `${result} - ${rightOperand}`;
        } else if (_.isNil(result) || _.isNil(rightOperand)) {
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
        if (tokenMatcher(operator, MULT)) {
          if (typeof result === 'string' || typeof rightOperand === 'string') {
            result = `${result} * ${rightOperand}`;
          } else if (_.isNil(result) || _.isNil(rightOperand)) {
            result = null;
          } else {
            result *= rightOperand;
          }
        } else if (tokenMatcher(operator, DIV)) {
          if (typeof result === 'string' || typeof rightOperand === 'string') {
            result = `${result} / ${rightOperand}`;
          } else if (_.isNil(result) || _.isNil(rightOperand)) {
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
    } else if (ctx.identite) {
      return this.visit(ctx.identite);
    } else if (ctx.reponse) {
      return this.visit(ctx.reponse);
    } else if (ctx.score) {
      return this.visit(ctx.score);
    } else if (ctx.min) {
      return this.visit(ctx.min);
    } else if (ctx.max) {
      return this.visit(ctx.max);
    }
  }

  primary(ctx: any) {
    if (ctx.VRAI) {
      return true;
    } else if (ctx.FAUX) {
      return false;
    } else if (ctx.vrai) {
      return true;
    } else if (ctx.faux) {
      return false;
    } else if (ctx.OUI) {
      return true;
    } else if (ctx.NON) {
      return false;
    } else if (ctx.oui) {
      return true;
    } else if (ctx.non) {
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
    } else if (_.isNil(term1) || _.isNil(term2)) {
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
    } else if (_.isNil(term1) || _.isNil(term2)) {
      return null;
    } else {
      return Math.max(term1, term2);
    }
  }

  identite(ctx: any) {
    // Règles historiques exprimées avec ces identifiants
    const identifier = this.visit(ctx.identifier) as
      | 'type'
      | 'population'
      | 'localisation';
    const primary = this.visit(ctx.primary);
    if (!this.identiteCollectivite) {
      throw new Error(
        `Information ${identifier} d'identité de la commune non trouvée`,
      );
    }
    if (identifier === 'type') {
      return (
        this.identiteCollectivite.type === primary ||
        this.identiteCollectivite.soustype === primary
      );
    } else if (identifier === 'population') {
      return this.identiteCollectivite.population_tags.includes(primary);
    } else if (identifier === 'localisation') {
      const drom = primary === 'DOM';
      return this.identiteCollectivite.drom === drom;
    }
  }

  reponse(ctx: any) {
    const reponseId = this.visit(ctx.identifier);

    if (ctx.primary) {
      const reponseVal = this.visit(ctx.primary);
      if (!this.reponses) {
        throw new Error(`Reponse à la question ${reponseId} non trouvée`);
      }
      return this.reponses && this.reponses[reponseId] === reponseVal;

      /*
(question_id, compared_choix_id) = (node[0][1], node[1][1])
        if question_id not in self.questions:
            raise FormuleError(f"Id de question inconnue: {question_id}.")
        question_type = self.questions[question_id].type
        if question_type == "proportion":
            raise FormuleError(
                f"La question d'id {question_id} est de type proportion, donc la fonction réponse n'attend qu'un argument."
            )
        allowed_choix_ids = (
            [choix.id for choix in self.questions[question_id].choix or []]
            if question_type == "choix"
            else ["OUI", "NON"]
        )
        if compared_choix_id not in allowed_choix_ids:
            raise FormuleError(
                f"L'id de choix {compared_choix_id} est inconnu pour la question {question_id}. Choix possibles : {', '.join(allowed_choix_ids)}"
            )
        return bool, "reponse"
    */
    } else {
      return this.reponses ? this.reponses[reponseId] : null;

      /**
       * question_id = node[0][1]
        if question_id not in self.questions:
            raise FormuleError(f"Id de question inconnue: {question_id}.")
        question_type = self.questions[question_id].type
        if question_type in ["choix", "binaire"]:
            raise FormuleError(
                f"La question d'id {question_id} est de type {question_type}, donc la fonction réponse attend deux arguments."
            )
        return float, "reponse"

       */
    }
  }

  score(ctx: any) {
    const referentielId = this.visit(ctx.identifier);
    if (this.scores) {
      if (referentielId in this.scores) {
        return this.scores[referentielId];
      } else {
        return null;
      }
    } else {
      // TODO: done in order to verify unit test, check if needed
      return `score(${referentielId})`;
    }
  }
}
const visitor = new CollectiviteExpressionVisitor();

@Injectable()
export default class ExpressionParserService {
  private readonly logger = new Logger(ExpressionParserService.name);

  constructor() {}

  parseAndEvaluateExpression(
    inputText: string,
    reponses: { [key: string]: boolean | number | string | null } | null = null,
    identiteCollectivite: IdentiteCollectivite | null = null,
    scores: { [key: string]: number } | null = null,
  ): number | boolean | string | null {
    const lexingResult = exprLexer.tokenize(inputText);

    parser.input = lexingResult.tokens;
    const cst = parser.statement();

    if (parser.errors.length > 0) {
      this.logger.error(
        `Parsing errors detected: ${JSON.stringify(parser.errors)}`,
      );
      throw new HttpException('Invalid expression', 500, {
        cause: parser.errors,
      });
    } else {
      visitor.reponses = reponses;
      visitor.identiteCollectivite = identiteCollectivite;
      visitor.scores = scores;
      const result = visitor.visit(cst);
      return result;
    }
  }
}
