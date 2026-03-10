import { HttpException, Injectable, Logger } from '@nestjs/common';
import {
  ExpressionParser,
  getExpressionVisitor,
} from '@tet/backend/utils/expression-parser';
import { evaluateIdentite } from '@tet/backend/utils/expression-parser/evaluate-identite';
import { getFormmattedErrors } from '@tet/backend/utils/expression-parser/get-formatted-errors.utils';
import { IdentiteCollectivite } from '@tet/domain/collectivites';
import { createToken, CstNode } from 'chevrotain';

const IDENTITE = createToken({ name: 'IDENTITE', pattern: /identite/i });
const REPONSE = createToken({ name: 'REPONSE', pattern: /reponse/i });
const SCORE = createToken({ name: 'SCORE', pattern: /score/i });

// tokens ajoutés au parser de base
const tokens = [IDENTITE, REPONSE, SCORE];

export type PersonnalisationReponses = {
  [key: string]: boolean | number | string | null;
};

class PersonnalisationsExpressionParser extends ExpressionParser {
  constructor() {
    super(tokens);
    try {
      this.performSelfAnalysis();
    } catch (err) {
      console.error(err);
    }
  }

  call = this.OVERRIDE_RULE('call', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.identite) },
      { ALT: () => this.SUBRULE(this.reponse) },
      { ALT: () => this.SUBRULE(this.score) },
      ...this.getCallHandlers.apply(this),
    ]);
  });

  private identite = this.RULE('identite', () => {
    this.consumeFuncTwoParams(IDENTITE);
  });

  private reponse = this.RULE('reponse', () => {
    this.consumeFuncTwoParamsLastOptional(REPONSE);
  });

  private score = this.RULE('score', () => {
    this.consumeFuncOneParam(SCORE);
  });
}

export const parser = new PersonnalisationsExpressionParser();

class PersonnalisationsExpressionVisitor extends getExpressionVisitor(
  parser.getBaseCstVisitorConstructor()
) {
  reponses: PersonnalisationReponses | null = null;
  identiteCollectivite: IdentiteCollectivite | null = null;
  scores: { [key: string]: number } | null = null;

  constructor() {
    super();
    this.validateVisitor();
  }

  call(ctx: any) {
    try {
      return super.call(ctx);
    } catch {
      if (ctx.identite) {
        return this.visit(ctx.identite);
      } else if (ctx.reponse) {
        return this.visit(ctx.reponse);
      } else if (ctx.score) {
        return this.visit(ctx.score);
      }
    }
  }

  identite(ctx: any) {
    const identifier = this.visit(ctx.identifier) as string;
    const primary = this.visit(ctx.primary) as string;
    return evaluateIdentite(this.identiteCollectivite, identifier, primary);
  }

  reponse(ctx: any) {
    const reponseId = this.visit(ctx.identifier) as string;

    if (ctx.primary) {
      const reponseVal = this.visit(ctx.primary);
      if (!this.reponses) {
        throw new Error(`Reponse à la question ${reponseId} non trouvée`);
      }
      return this.reponses && this.reponses[reponseId] === reponseVal;
    } else {
      return this.reponses ? this.reponses[reponseId] : null;
    }
  }

  score(ctx: any) {
    const referentielId = this.visit(ctx.identifier) as string;
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

// Visitor for extracting personnalisation questions and their expected values
class PersonnalisationQuestionsExtractionVisitor extends getExpressionVisitor(
  parser.getBaseCstVisitorConstructorWithDefaults()
) {
  public questions: {
    [questionId: string]: Array<boolean | number | string | null>;
  } = {};

  constructor() {
    super();
    this.validateVisitor();
  }

  private addQuestionValue(
    questionId: string,
    value: boolean | number | string | null
  ) {
    const existing = this.questions[questionId] ?? [];
    if (!existing.some((v) => v === value)) {
      this.questions[questionId] = [...existing, value];
    }
  }

  // Override call to route to our custom handlers when needed
  call(ctx: any) {
    try {
      return super.call(ctx);
    } catch {
      if (ctx.identite) {
        return this.visit(ctx.identite);
      } else if (ctx.reponse) {
        return this.visit(ctx.reponse);
      } else if (ctx.score) {
        return this.visit(ctx.score);
      }
    }
  }

  // We only care about reponse(...) calls to collect personnalisation questions
  reponse(ctx: any) {
    const questionId = this.visit(ctx.identifier) as string;

    if (ctx.primary) {
      const value = this.visit(ctx.primary) as boolean | number | string | null;
      this.addQuestionValue(questionId, value);
    } else {
      this.addQuestionValue(questionId, null);
    }

    // This visitor is only used for extraction, its return value is ignored
    return null;
  }

  // For identite/score we do not collect anything; keep them as no-ops.
  identite(_ctx: any) {
    return null;
  }

  score(_ctx: any) {
    return null;
  }
}

@Injectable()
export default class PersonnalisationsExpressionService {
  private readonly logger = new Logger(PersonnalisationsExpressionService.name);

  parseExpression(inputText: string): CstNode {
    const lexingResult = parser.lexer.tokenize(inputText);
    //console.log(JSON.stringify(lexingResult.tokens));
    parser.input = lexingResult.tokens;
    const cst = parser.statement();

    if (parser.errors && parser.errors.length > 0) {
      this.logger.error(
        `Parsing errors detected: ${JSON.stringify(parser.errors)}`
      );
      throw new HttpException(getFormmattedErrors(parser.errors), 500, {
        cause: parser.errors,
      });
    } else {
      return cst;
    }
  }

  parseAndEvaluateExpression(
    inputText: string,
    reponses: PersonnalisationReponses | null = null,
    identiteCollectivite: IdentiteCollectivite | null = null,
    scores: { [key: string]: number } | null = null
  ): number | boolean | string | null {
    const cst = this.parseExpression(inputText);
    const visitor = new PersonnalisationsExpressionVisitor();
    visitor.reponses = reponses;
    visitor.identiteCollectivite = identiteCollectivite;
    visitor.scores = scores;
    return visitor.visit(cst) as string | number | boolean | null;
  }

  extractNeededQuestionsFromExpression(inputText: string): {
    [questionId: string]: Array<boolean | number | string | null>;
  } {
    const cst = this.parseExpression(inputText);
    const extractionVisitor = new PersonnalisationQuestionsExtractionVisitor();
    extractionVisitor.visit(cst);
    return extractionVisitor.questions;
  }
}
