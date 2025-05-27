import { HttpException, Injectable, Logger } from '@nestjs/common';
import { createToken, CstNode } from 'chevrotain';
import { IdentiteCollectivite } from '../../collectivites/identite-collectivite.dto';
import {
  ExpressionParserBase,
  getExpressionVisitor,
} from './expression-parser-base';

const IDENTITE = createToken({ name: 'IDENTITE', pattern: /identite/i });
const REPONSE = createToken({ name: 'REPONSE', pattern: /reponse/i });
const SCORE = createToken({ name: 'SCORE', pattern: /score/i });

// tokens ajoutés au parser de base
const tokens = [IDENTITE, REPONSE, SCORE];

class ExprParser extends ExpressionParserBase {
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

const parser = new ExprParser();

const BaseCSTVisitor = parser.getBaseCstVisitorConstructor();

class CollectiviteExpressionVisitor extends getExpressionVisitor(
  BaseCSTVisitor
) {
  reponses: { [key: string]: boolean | number | string | null } | null = null;
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
    // Règles historiques exprimées avec ces identifiants
    const identifier = this.visit(ctx.identifier) as
      | 'type'
      | 'population'
      | 'localisation'
      | 'dans_aire_urbaine';
    const primary = this.visit(ctx.primary);
    if (!this.identiteCollectivite) {
      throw new Error(
        `Information ${identifier} d'identité de la collectivité non trouvée`
      );
    }
    if (identifier === 'type') {
      return (
        this.identiteCollectivite.type === primary ||
        this.identiteCollectivite.soustype === primary
      );
    } else if (identifier === 'population') {
      return this.identiteCollectivite.populationTags.includes(primary);
    } else if (identifier === 'localisation') {
      const drom = primary === 'DOM';
      return this.identiteCollectivite.drom === drom;
    } else if (identifier === 'dans_aire_urbaine') {
      return this.identiteCollectivite.dansAireUrbaine === primary;
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
    } else {
      return this.reponses ? this.reponses[reponseId] : null;
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

  parseExpression(inputText: string): CstNode {
    const lexingResult = parser.lexer.tokenize(inputText);
    //console.log(JSON.stringify(lexingResult.tokens));
    parser.input = lexingResult.tokens;
    const cst = parser.statement();

    if (parser.errors && parser.errors.length > 0) {
      this.logger.error(
        `Parsing errors detected: ${JSON.stringify(parser.errors)}`
      );
      throw new HttpException('Invalid expression', 500, {
        cause: parser.errors,
      });
    } else {
      return cst;
    }
  }

  parseAndEvaluateExpression(
    inputText: string,
    reponses: { [key: string]: boolean | number | string | null } | null = null,
    identiteCollectivite: IdentiteCollectivite | null = null,
    scores: { [key: string]: number } | null = null
  ): number | boolean | string | null {
    const cst = this.parseExpression(inputText);
    visitor.reponses = reponses;
    visitor.identiteCollectivite = identiteCollectivite;
    visitor.scores = scores;
    return visitor.visit(cst);
  }
}
