import {
  CollectivitePopulationTypeEnum,
  IdentiteCollectivite,
} from '@/backend/collectivites/identite-collectivite.dto';
import {
  ExpressionParser,
  getExpressionVisitor,
} from '@/backend/utils/expression-parser';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { createToken, CstNode } from 'chevrotain';
import { isNil } from 'es-toolkit';

const VAL = createToken({ name: 'VAL', pattern: /val/ });
const OPT_VAL = createToken({ name: 'OPT_VAL', pattern: /opt_val/ });
const CIBLE = createToken({ name: 'CIBLE', pattern: /cible/ });
const LIMITE = createToken({ name: 'LIMITE', pattern: /limite/ });
const IDENTITE = createToken({ name: 'IDENTITE', pattern: /identite/i });

// tokens ajoutés au parser de base
const tokens = [VAL, OPT_VAL, CIBLE, LIMITE, IDENTITE];

class IndicateurExpressionParser extends ExpressionParser {
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
      { ALT: () => this.SUBRULE(this.cible) },
      { ALT: () => this.SUBRULE(this.limite) },
      { ALT: () => this.SUBRULE(this.identite) },
      ...this.getCallHandlers.apply(this),
    ]);
  });

  private val = this.RULE('val', () => {
    this.consumeFuncOneParam(VAL);
  });

  private opt_val = this.RULE('opt_val', () => {
    this.consumeFuncOneParam(OPT_VAL);
  });

  private cible = this.RULE('cible', () => {
    this.consumeFuncOneParam(CIBLE);
  });

  private limite = this.RULE('limite', () => {
    this.consumeFuncOneParam(LIMITE);
  });

  private identite = this.RULE('identite', () => {
    this.consumeFuncTwoParams(IDENTITE);
  });
}

export const parser = new IndicateurExpressionParser();

// correspondance entre un identifiant d'indicateur et une valeur
type IndicateurValeurParIdentifiant = {
  [key: string]: number | null;
};

type TypeValeurs = 'cible' | 'limite';

type IndicateurValeursParType = Partial<
  Record<TypeValeurs, IndicateurValeurParIdentifiant | null>
>;

export type EvaluationContext = {
  valeursComplementaires?: IndicateurValeursParType;
  identiteCollectivite?: IdentiteCollectivite;
};

class IndicateurExpressionVisitor extends getExpressionVisitor(
  parser.getBaseCstVisitorConstructor()
) {
  sourceIndicateursValeurs: IndicateurValeurParIdentifiant | null = null;
  // valeurs complémentaires pour le calcul d'un score à partir d'un indicateur
  indicateurValeursComplementaires: IndicateurValeursParType | undefined;
  identiteCollectivite: IdentiteCollectivite | null = null;

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
      } else if (ctx.cible) {
        return this.visit(ctx.cible);
      } else if (ctx.limite) {
        return this.visit(ctx.limite);
      } else if (ctx.identite) {
        return this.visit(ctx.identite);
      }
    }
  }

  val(ctx: any) {
    const indicateurIdentifier = this.visit(ctx.identifier);
    if (!this.sourceIndicateursValeurs) {
      throw new Error(`Missing source indicateur valeurs`);
    }
    return (
      this.sourceIndicateursValeurs[indicateurIdentifier as string] || null
    );
  }

  // comme `val` mais renvoi `0` si la valeur n'est pas disponible
  opt_val(ctx: any) {
    const indicateurIdentifier = this.val(ctx);
    return indicateurIdentifier ?? 0;
  }

  cible(ctx: any) {
    const indicateurIdentifier = this.visit(ctx.identifier);
    if (!this.indicateurValeursComplementaires?.cible) {
      throw new Error(`Missing cible indicateur valeurs`);
    }
    return (
      this.indicateurValeursComplementaires.cible[
        indicateurIdentifier as string
      ] || null
    );
  }

  limite(ctx: any) {
    const indicateurIdentifier = this.visit(ctx.identifier);
    if (!this.indicateurValeursComplementaires?.limite) {
      throw new Error(`Missing limite indicateur valeurs`);
    }

    return (
      this.indicateurValeursComplementaires.limite[
        indicateurIdentifier as string
      ] || null
    );
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
      return this.identiteCollectivite.populationTags.includes(
        primary as CollectivitePopulationTypeEnum
      );
    } else if (identifier === 'localisation') {
      const drom = primary === 'DOM';
      return this.identiteCollectivite.drom === drom;
    } else if (identifier === 'dans_aire_urbaine') {
      return this.identiteCollectivite.dansAireUrbaine === primary;
    }
  }
}

const visitor = new IndicateurExpressionVisitor();

@Injectable()
export default class IndicateurExpressionService {
  private readonly FORMULA_MANDATORY_INDICATEUR_REGEX =
    /[^_](?:val|cible|limite)\(\s?([a-z1-9_.]*)\s?(?:,\s?([a-z1-9_.]*)\s?)?\)/g;

  private readonly FORMULA_OPTIONAL_INDICATEUR_REGEX =
    /[^_]opt_val\(\s?([a-z1-9_.]*)\s?(?:,\s?([a-z1-9_.]*)\s?)?\)/g;

  private readonly logger = new Logger(IndicateurExpressionService.name);

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
    sourceIndicateursValeurs: IndicateurValeurParIdentifiant,
    context?: EvaluationContext
  ): number | null {
    const { valeursComplementaires, identiteCollectivite } = context || {};
    if (!valeursComplementaires) {
      const atLeastOneValue = Object.values(
        sourceIndicateursValeurs || []
      ).some((v) => !isNil(v));
      if (!atLeastOneValue) {
        return null;
      }
    }
    const cst = this.parseExpression(inputText);
    visitor.sourceIndicateursValeurs = sourceIndicateursValeurs;
    visitor.indicateurValeursComplementaires = valeursComplementaires;
    visitor.identiteCollectivite = identiteCollectivite || null;
    const result = visitor.visit(cst);
    if (!isFinite(result as number)) {
      this.logger.log(
        `invalid result: ${result} for expression ${inputText} with source values ${JSON.stringify(
          sourceIndicateursValeurs
        )}`
      );
      return null;
    }
    return result as number;
  }
}
