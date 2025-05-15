import {
  common,
  ExpressionParserBase,
  getExpressionVisitor,
} from '@/backend/personnalisations/services/expression-parser-base';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { createToken, CstNode } from 'chevrotain';
import { isNil } from 'es-toolkit';

const VAL = createToken({ name: 'VAL', pattern: /val/ });
const OPT_VAL = createToken({ name: 'OPT_VAL', pattern: /opt_val/ });

// tokens ajoutés au parser de base
const tokens = [VAL, OPT_VAL];

class IndicateurValeurExprParser extends ExpressionParserBase {
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
      { ALT: () => this.SUBRULE(this.val) },
      { ALT: () => this.SUBRULE(this.opt_val) },
      { ALT: () => this.SUBRULE(this.min) },
      { ALT: () => this.SUBRULE(this.max) },
      ...this.getCallHandlers.apply(this),
    ]);
  });

  private val = this.RULE('val', () => {
    this.CONSUME(VAL);
    this.CONSUME(common.LPAR);
    this.SUBRULE(this.identifier);
    this.CONSUME(common.RPAR);
  });

  private opt_val = this.RULE('opt_val', () => {
    this.CONSUME(OPT_VAL);
    this.CONSUME(common.LPAR);
    this.SUBRULE(this.identifier);
    this.CONSUME(common.RPAR);
  });
}

const parser = new IndicateurValeurExprParser();

const BaseCSTVisitor = parser.getBaseCstVisitorConstructor();

class IndicateurValeurExpressionVisitor extends getExpressionVisitor(
  BaseCSTVisitor
) {
  sourceIndicateurValeurs: { [key: string]: number | null } | null = null;

  constructor() {
    super();
    this.validateVisitor();
  }

  call(ctx: any) {
    try {
      return super.call(ctx);
    } catch {
      if (ctx.opt_val) {
        return this.visit(ctx.opt_val);
      } else if (ctx.val) {
        return this.visit(ctx.val);
      }
    }
  }

  val(ctx: any) {
    const indicateurIdentifier = this.visit(ctx.identifier);
    if (!this.sourceIndicateurValeurs) {
      throw new Error(`Missing source indicateur valeurs`);
    }
    return this.sourceIndicateurValeurs[indicateurIdentifier] || null;
  }

  opt_val(ctx: any) {
    const indicateurIdentifier = this.visit(ctx.identifier);
    if (!this.sourceIndicateurValeurs) {
      throw new Error(`Missing source indicateur valeurs`);
    }

    // optional: return 0
    return this.sourceIndicateurValeurs[indicateurIdentifier] || 0;
  }
}
const visitor = new IndicateurValeurExpressionVisitor();

@Injectable()
export default class IndicateurValeurExpressionParserService {
  private readonly FORMULA_MANDATORY_INDICATEUR_REGEX =
    /[^_]val\(\s?([a-z1-9_.]*)\s?(?:,\s?([a-z1-9_.]*)\s?)?\)/g;

  private readonly FORMULA_OPTIONAL_INDICATEUR_REGEX =
    /[^_]opt_val\(\s?([a-z1-9_.]*)\s?(?:,\s?([a-z1-9_.]*)\s?)?\)/g;

  private readonly logger = new Logger(
    IndicateurValeurExpressionParserService.name
  );

  extractNeededSourceIndicateursFromFormula(formula: string): {
    identifiant: string;
    optional?: boolean;
    source?: string;
  }[] {
    const neededSourceIndicateurs: {
      identifiant: string;
      optional?: boolean;
      source?: string;
    }[] = [];
    const formulaWithSpaces = ` ${formula.toLowerCase()} `;
    const allMandatoryMatches = formulaWithSpaces.matchAll(
      this.FORMULA_MANDATORY_INDICATEUR_REGEX
    );
    for (const match of allMandatoryMatches) {
      const indicateurIdentifiant = match[1];
      const indicateurSource = match.length >= 3 ? match[2] : undefined;
      if (
        !neededSourceIndicateurs.find(
          (ind) => ind.identifiant === indicateurIdentifiant
        )
      ) {
        const detectedIndicateur: {
          identifiant: string;
          optional?: boolean;
          source?: string;
        } = {
          identifiant: indicateurIdentifiant,
          optional: false,
        };
        if (indicateurSource) {
          detectedIndicateur.source = indicateurSource;
        }
        neededSourceIndicateurs.push(detectedIndicateur);
      }
    }

    const allOptionalMatches = formulaWithSpaces.matchAll(
      this.FORMULA_OPTIONAL_INDICATEUR_REGEX
    );
    for (const match of allOptionalMatches) {
      const indicateurIdentifiant = match[1];
      const indicateurSource = match.length >= 3 ? match[2] : undefined;
      if (
        !neededSourceIndicateurs.find(
          (ind) => ind.identifiant === indicateurIdentifiant
        )
      ) {
        const detectedIndicateur: {
          identifiant: string;
          optional?: boolean;
          source?: string;
        } = {
          identifiant: indicateurIdentifiant,
          optional: true,
        };
        if (indicateurSource) {
          detectedIndicateur.source = indicateurSource;
        }

        neededSourceIndicateurs.push(detectedIndicateur);
      }
    }
    return neededSourceIndicateurs;
  }

  parseExpression(inputText: string): CstNode {
    const lexingResult = parser.lexer.tokenize(inputText);
    parser.input = lexingResult.tokens;
    const cst = parser.statement();

    if (parser.errors.length > 0) {
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
    sourceIndicateurValeurs: { [key: string]: number | null }
  ): number | null {
    const atLeastOneValue = Object.values(sourceIndicateurValeurs).some(
      (v) => !isNil(v)
    );
    if (!atLeastOneValue) {
      return null;
    }
    const cst = this.parseExpression(inputText);
    visitor.sourceIndicateurValeurs = sourceIndicateurValeurs;
    const result = visitor.visit(cst);
    if (!isFinite(result)) {
      this.logger.log(
        `invalid result: ${result} for expression ${inputText} with source values ${JSON.stringify(
          sourceIndicateurValeurs
        )}`
      );
      return null;
    }
    return result;
  }
}
