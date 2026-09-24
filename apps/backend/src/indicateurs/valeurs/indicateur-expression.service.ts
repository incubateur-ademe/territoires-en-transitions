import { HttpException, Injectable, Logger } from '@nestjs/common';
import { PersonnalisationReponses } from '@tet/backend/collectivites/personnalisations/services/personnalisations-expression.service';
import {
  ExpressionParser,
  getExpressionVisitor,
} from '@tet/backend/utils/expression-parser';
import { evaluateIdentite } from '@tet/backend/utils/expression-parser/evaluate-identite';
import { getFormmattedErrors } from '@tet/backend/utils/expression-parser/get-formatted-errors.utils';
import { IdentiteCollectivite } from '@tet/domain/collectivites';
import { createToken, CstNode } from 'chevrotain';
import { isEqual, isNil } from 'es-toolkit';
import { computeProgression, computeValeurAttendue } from './progression.rules';
import { ANNEE_REFERENCE_SNBC_V2 } from '@tet/domain/indicateurs';
import {
  ProgressionParams,
  ReferencedIndicateur,
} from './referenced-indicateur.dto';

const VAL = createToken({ name: 'VAL', pattern: /val/ });
const OPT_VAL = createToken({ name: 'OPT_VAL', pattern: /opt_val/ });
const CIBLE = createToken({ name: 'CIBLE', pattern: /cible/ });
const LIMITE = createToken({ name: 'LIMITE', pattern: /limite/ });
const IDENTITE = createToken({ name: 'IDENTITE', pattern: /identite/i });
const REPONSE = createToken({ name: 'REPONSE', pattern: /reponse/i });
const EST_SUIVI = createToken({ name: 'EST_SUIVI', pattern: /est_suivi/i });
const PROGRESSION_SNBC = createToken({
  name: 'PROGRESSION_SNBC',
  pattern: /progression_snbc/i,
});
const REDUCTION = createToken({ name: 'REDUCTION', pattern: /reduction/i });

// tokens ajoutés au parser de base
const tokens = [
  VAL,
  OPT_VAL,
  CIBLE,
  LIMITE,
  IDENTITE,
  REPONSE,
  EST_SUIVI,
  PROGRESSION_SNBC,
  REDUCTION,
];

// tokens dont l'évaluation lit une valeur d'indicateur sélectionnée par la
// collectivité (`sourceIndicateursValeurs`) — seule source dont l'absence
// rend un score non calculable ; `cible`/`limite`/`identite`/`reponse`
// puisent dans des maps de contexte distinctes et n'en dépendent pas.
export const VALUE_SOURCE_TOKENS = [
  'val',
  'opt_val',
  'progression_snbc',
  'reduction',
] as const;

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
      { ALT: () => this.SUBRULE(this.est_suivi) },
      { ALT: () => this.SUBRULE(this.progression_snbc) },
      { ALT: () => this.SUBRULE(this.reduction) },
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

  private est_suivi = this.RULE('est_suivi', () => {
    this.consumeFuncOneParam(EST_SUIVI);
  });

  private progression_snbc = this.RULE('progression_snbc', () => {
    this.consumeFuncTwoParamsLastOptional(PROGRESSION_SNBC);
  });

  private reduction = this.RULE('reduction', () => {
    this.consumeFuncFourParams(REDUCTION);
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
  // pour chaque indicateur référencé par `est_suivi(...)` : une valeur
  // est-elle actuellement sélectionnée (et non nulle) pour le calcul du
  // score de cette action, pour ce type de score (fait/programme) ?
  indicateursSuivis?: Record<string, boolean>;
  // année (`dateValeur`) de la valeur utilisée pour chaque indicateur, pour
  // `progression_snbc(...)` et `reduction(...)`. Propre à une action et à un
  // type de score : absent au calcul `programme`.
  anneesUtilisees?: Record<string, number>;
  // valeurs préchargées pour `progression_snbc(...)` et `reduction(...)`,
  // indexées par identifiant d'indicateur puis par année
  valeursProgression?: ValeursProgression;
};

export type ValeursProgression = Record<
  string,
  Record<number, { objectifSnbc?: number; resultatDepart?: number }>
>;

class IndicateurExpressionVisitor extends getExpressionVisitor(
  parser.getBaseCstVisitorConstructor()
) {
  sourceIndicateursValeurs: IndicateurValeurParIdentifiant | null = null;
  // valeurs complémentaires pour le calcul d'un score à partir d'un indicateur
  indicateurValeursComplementaires: IndicateurValeursParType | undefined;
  identiteCollectivite: IdentiteCollectivite | null = null;
  reponses: PersonnalisationReponses | null = null;
  indicateursSuivis: Record<string, boolean> | null = null;
  anneesUtilisees: Record<string, number> | null = null;
  valeursProgression: ValeursProgression | null = null;

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
      } else if (ctx.est_suivi) {
        return this.visit(ctx.est_suivi);
      } else if (ctx.progression_snbc) {
        return this.visit(ctx.progression_snbc);
      } else if (ctx.reduction) {
        return this.visit(ctx.reduction);
      }
    }
  }

  val(ctx: any) {
    // les identifiants sont extraits en minuscules par
    // `IndicateurReferenceExtractionVisitor` (voir `addReference`) : ils
    // doivent l'être aussi ici pour indexer les mêmes maps.
    const indicateurIdentifier = (
      this.visit(ctx.identifier) as string
    ).toLowerCase();
    if (!this.sourceIndicateursValeurs) {
      throw new Error(`Missing source indicateur valeurs`);
    }
    return this.sourceIndicateursValeurs[indicateurIdentifier] ?? null;
  }

  // comme `val` mais renvoi `0` si la valeur n'est pas disponible
  opt_val(ctx: any): number | null {
    const indicateurIdentifier = this.val(ctx);
    return indicateurIdentifier ?? 0;
  }

  cible(ctx: any) {
    const indicateurIdentifier = (
      this.visit(ctx.identifier) as string
    ).toLowerCase();
    if (!this.indicateurValeursComplementaires?.cible) {
      throw new Error(`Missing cible indicateur valeurs`);
    }
    return (
      this.indicateurValeursComplementaires.cible[indicateurIdentifier] ?? null
    );
  }

  limite(ctx: any) {
    const indicateurIdentifier = (
      this.visit(ctx.identifier) as string
    ).toLowerCase();
    if (!this.indicateurValeursComplementaires?.limite) {
      throw new Error(`Missing limite indicateur valeurs`);
    }

    return (
      this.indicateurValeursComplementaires.limite[indicateurIdentifier] ?? null
    );
  }

  identite(ctx: any) {
    const identifier = this.visit(ctx.identifier) as string;
    // `primary` rend un nombre pour un littéral numérique : le caster en string
    // ferait planter les comparaisons de l'évaluateur sur un seuil.
    const primary = this.visit(ctx.primary) as string | number | boolean;
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

  est_suivi(ctx: any): boolean {
    const indicateurIdentifier = (
      this.visit(ctx.identifier) as string
    ).toLowerCase();
    return this.indicateursSuivis?.[indicateurIdentifier] ?? false;
  }

  // `null` (aucun score) si la valeur utilisée ou son année manque, ce qui est
  // le cas au calcul `programme`
  private getValeurEtAnneeUtilisees(identifiant: string) {
    if (!this.sourceIndicateursValeurs) {
      throw new Error(`Missing source indicateur valeurs`);
    }
    return {
      valeurUtilisee: this.sourceIndicateursValeurs[identifiant] ?? null,
      anneeUtilisee: this.anneesUtilisees?.[identifiant] ?? null,
    };
  }

  progression_snbc(ctx: any): number | null {
    // en minuscules comme `val`, `cible` et `est_suivi` : les maps sont
    // indexées par les identifiants extraits en minuscules
    const identifiant = (this.visit(ctx.identifier) as string).toLowerCase();
    const anneeDepart = ctx.primary
      ? (this.visit(ctx.primary) as number)
      : ANNEE_REFERENCE_SNBC_V2;
    const { valeurUtilisee, anneeUtilisee } =
      this.getValeurEtAnneeUtilisees(identifiant);
    if (anneeUtilisee === null) {
      return null;
    }
    const valeursParAnnee = this.valeursProgression?.[identifiant];
    return computeProgression(
      valeursParAnnee?.[anneeDepart]?.objectifSnbc,
      valeursParAnnee?.[anneeUtilisee]?.objectifSnbc,
      valeurUtilisee
    );
  }

  reduction(ctx: any): number | null {
    const identifiant = (this.visit(ctx.identifier) as string).toLowerCase();
    const [anneeDepart, anneeCible, reductionCible] = (
      ctx.primary as CstNode[]
    ).map((node) => this.visit(node) as number);
    const { valeurUtilisee, anneeUtilisee } =
      this.getValeurEtAnneeUtilisees(identifiant);
    const valeurDepart =
      this.valeursProgression?.[identifiant]?.[anneeDepart]?.resultatDepart;
    const valeurAttendue = computeValeurAttendue({
      valeurDepart,
      anneeDepart,
      anneeCible,
      reductionCible,
      anneeUtilisee,
    });
    return computeProgression(valeurDepart, valeurAttendue, valeurUtilisee);
  }
}

// Visitor pour extraire les références d'indicateurs
class IndicateurReferenceExtractionVisitor extends getExpressionVisitor(
  parser.getBaseCstVisitorConstructorWithDefaults()
) {
  public references: ReferencedIndicateur[] = [];

  private isOptional(token: string) {
    // `est_suivi` ne bloque jamais un calcul faute de sélection : il renvoie
    // `faux` en l'absence de valeur sélectionnée, tout comme `opt_val`
    // renvoie `0`.
    return token.startsWith('opt_') || token === 'est_suivi';
  }

  constructor() {
    super();
    this.validateVisitor();
  }

  private addReference(ref: {
    identifiant: string;
    source?: string;
    token: string;
    progression?: ProgressionParams;
  }) {
    const identifiant = ref.identifiant.toLowerCase();
    const { source, token, progression } = ref;

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
      if (progression) {
        const progressions = existingRef.progressions ?? [];
        if (!progressions.some((p) => isEqual(p, progression))) {
          progressions.push(progression);
        }
        existingRef.progressions = progressions;
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
      if (progression) {
        newRef.progressions = [progression];
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
      } else if (ctx.est_suivi) {
        return this.visit(ctx.est_suivi);
      } else if (ctx.progression_snbc) {
        return this.visit(ctx.progression_snbc);
      } else if (ctx.reduction) {
        return this.visit(ctx.reduction);
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

  est_suivi(ctx: any) {
    const identifiant = this.visit(ctx.identifier) as string;
    this.addReference({ identifiant, token: 'est_suivi' });
    return null;
  }

  progression_snbc(ctx: any) {
    const identifiant = this.visit(ctx.identifier) as string;
    const anneeDepart = ctx.primary
      ? (this.visit(ctx.primary) as number)
      : ANNEE_REFERENCE_SNBC_V2;
    this.addReference({
      identifiant,
      token: 'progression_snbc',
      progression: { token: 'progression_snbc', anneeDepart },
    });
    return null;
  }

  reduction(ctx: any) {
    const identifiant = this.visit(ctx.identifier) as string;
    const [anneeDepart, anneeCible, reductionCible] = (
      ctx.primary as CstNode[]
    ).map((node) => this.visit(node) as number);
    this.addReference({
      identifiant,
      token: 'reduction',
      progression: {
        token: 'reduction',
        anneeDepart,
        anneeCible,
        reductionCible,
      },
    });
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
    const {
      valeursComplementaires,
      identiteCollectivite,
      reponses,
      indicateursSuivis,
      anneesUtilisees,
      valeursProgression,
    } = context || {};
    // une formule peut ne dépendre que d'`est_suivi(...)`, sans aucune
    // valeur source : ne pas court-circuiter dans ce cas.
    if (!valeursComplementaires && !indicateursSuivis) {
      const atLeastOneValue = Object.values(
        sourceIndicateursValeurs || []
      ).some((v) => !isNil(v));
      if (!atLeastOneValue) {
        return null;
      }
    }
    const cst = this.parseExpression(inputText);
    const visitor = new IndicateurExpressionVisitor();
    visitor.sourceIndicateursValeurs = sourceIndicateursValeurs;
    visitor.indicateurValeursComplementaires = valeursComplementaires;
    visitor.identiteCollectivite = identiteCollectivite || null;
    visitor.reponses = reponses || null;
    visitor.indicateursSuivis = indicateursSuivis || null;
    visitor.anneesUtilisees = anneesUtilisees || null;
    visitor.valeursProgression = valeursProgression || null;
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
