import {
  CollectivitePopulationTypeEnum,
  IdentiteCollectivite,
} from '@/domain/collectivites';
import { PersonnalisationReponses } from '@/backend/collectivites/personnalisations/services/personnalisations-expression.service';
import {
  ExpressionParser,
  getExpressionVisitor,
} from '@/backend/utils/expression-parser';
import { getFormmattedErrors } from '@/backend/utils/expression-parser/get-formatted-errors.utils';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { createToken, CstNode } from 'chevrotain';
import { isNil } from 'es-toolkit';
import { ReferencedIndicateur } from './referenced-indicateur.dto';

const VAL = createToken({ name: 'VAL', pattern: /val/ });
const OPT_VAL = createToken({ name: 'OPT_VAL', pattern: /opt_val/ });
const CIBLE = createToken({ name: 'CIBLE', pattern: /cible/ });
const LIMITE = createToken({ name: 'LIMITE', pattern: /limite/ });
const IDENTITE = createToken({ name: 'IDENTITE', pattern: /identite/i });
const REPONSE = createToken({ name: 'REPONSE', pattern: /reponse/i });

// tokens ajoutés au parser de base
const tokens = [VAL, OPT_VAL, CIBLE, LIMITE, IDENTITE, REPONSE];

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
      { ALT: () => this.SUBRULE(this.reponse) },
      ...this.getCallHandlers.apply(this),
    ]);
  });

  private val = this.RULE('val', () => {
    this.consumeFuncTwoParamsLastOptional(VAL);
  });

  private opt_val = this.RULE('opt_val', () => {
    this.consumeFuncTwoParamsLastOptional(OPT_VAL);
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

  private reponse = this.RULE('reponse', () => {
    this.consumeFuncTwoParamsLastOptional(REPONSE);
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
  reponses?: PersonnalisationReponses;
};

class IndicateurExpressionVisitor extends getExpressionVisitor(
  parser.getBaseCstVisitorConstructor()
) {
  sourceIndicateursValeurs: IndicateurValeurParIdentifiant | null = null;
  // valeurs complémentaires pour le calcul d'un score à partir d'un indicateur
  indicateurValeursComplementaires: IndicateurValeursParType | undefined;
  identiteCollectivite: IdentiteCollectivite | null = null;
  reponses: PersonnalisationReponses | null = null;

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
      } else if (ctx.reponse) {
        return this.visit(ctx.reponse);
      }
    }
  }

  val(ctx: any) {
    const indicateurIdentifier = this.visit(ctx.identifier);
    if (!this.sourceIndicateursValeurs) {
      throw new Error(`Missing source indicateur valeurs`);
    }
    return (
      this.sourceIndicateursValeurs[indicateurIdentifier as string] ?? null
    );
  }

  // comme `val` mais renvoi `0` si la valeur n'est pas disponible
  opt_val(ctx: any): number | null {
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
      ] ?? null
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
      ] ?? null
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
}

const visitor = new IndicateurExpressionVisitor();

// Visitor pour extraire les références d'indicateurs
class IndicateurReferenceExtractionVisitor extends getExpressionVisitor(
  parser.getBaseCstVisitorConstructorWithDefaults()
) {
  public references: ReferencedIndicateur[] = [];

  private isOptional(token: string) {
    return token.startsWith('opt_');
  }

  constructor() {
    super();
    this.validateVisitor();
  }

  private addReference(ref: {
    identifiant: string;
    source?: string;
    token: string;
  }) {
    const identifiant = ref.identifiant.toLowerCase();
    const { source, token } = ref;

    const existingRef = this.references.find(
      (r) => r.identifiant === identifiant
    );
    if (existingRef) {
      if (source && !existingRef.sources?.includes(source)) {
        existingRef.sources = [...(existingRef.sources || []), source];
      }
      if (token && !existingRef.tokens.includes(token)) {
        existingRef.tokens.push(token);
        if (existingRef.optional && !this.isOptional(token)) {
          existingRef.optional = false;
        }
      }
    } else {
      const newRef: ReferencedIndicateur = {
        identifiant,
        tokens: [token],
        optional: this.isOptional(token),
      };
      if (source) {
        newRef.sources = [source];
      }
      this.references.push(newRef);
    }
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
      } else if (ctx.reponse) {
        return this.visit(ctx.reponse);
      }
    }
  }

  val(ctx: any) {
    const identifiant = this.visit(ctx.identifier) as string;
    let source: string | undefined = undefined;
    if (ctx.primary) {
      // cas val(x, y)
      source = this.visit(ctx.primary) as string | undefined;
    }
    this.addReference({ identifiant, source, token: 'val' });
    return null;
  }

  opt_val(ctx: any) {
    const identifiant = this.visit(ctx.identifier) as string;
    let source: string | undefined = undefined;
    if (ctx.primary) {
      // cas opt_val(x, y)
      source = this.visit(ctx.primary) as string | undefined;
    }
    this.addReference({ identifiant, source, token: 'opt_val' });
    return null;
  }

  cible(ctx: any) {
    const identifiant = this.visit(ctx.identifier) as string;
    this.addReference({ identifiant, token: 'cible' });
    return null;
  }

  limite(ctx: any) {
    const identifiant = this.visit(ctx.identifier) as string;
    this.addReference({ identifiant, token: 'limite' });
    return null;
  }
}

@Injectable()
export default class IndicateurExpressionService {
  private readonly logger = new Logger(IndicateurExpressionService.name);

  extractNeededSourceIndicateursFromFormula(
    formula: string
  ): ReferencedIndicateur[] {
    // On parse la formule pour obtenir le CST
    const lexingResult = parser.lexer.tokenize(formula);
    parser.input = lexingResult.tokens;
    const cst = parser.statement();
    if (parser.errors.length > 0) {
      this.logger.error(
        `Parsing errors detected: ${JSON.stringify(parser.errors)}`
      );
      throw new HttpException(getFormmattedErrors(parser.errors), 500, {
        cause: parser.errors,
      });
    }
    const refVisitor = new IndicateurReferenceExtractionVisitor();
    refVisitor.visit(cst);
    return refVisitor.references;
  }

  parseExpression(inputText: string): CstNode {
    const lexingResult = parser.lexer.tokenize(inputText);
    parser.input = lexingResult.tokens;
    const cst = parser.statement();

    if (parser.errors.length > 0) {
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
    sourceIndicateursValeurs: IndicateurValeurParIdentifiant,
    context?: EvaluationContext
  ): number | null {
    const { valeursComplementaires, identiteCollectivite, reponses } =
      context || {};
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
    visitor.reponses = reponses || null;
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
