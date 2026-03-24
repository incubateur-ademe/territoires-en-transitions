export class QuestionInconnue {
  readonly _tag = 'QuestionInconnue';
  constructor(
    readonly actionId: string,
    readonly ruleType: string,
    readonly questionId: string
  ) {}
  get message() {
    return `La question "${this.questionId}" utilisée dans l'expression de ${this.ruleType} de l'action ${this.actionId} n'existe pas`;
  }
}

export class ValeurIncoherente {
  readonly _tag = 'ValeurIncoherente';
  constructor(
    readonly actionId: string,
    readonly ruleType: string,
    readonly questionId: string,
    readonly questionType: string,
    readonly valeur: string,
    readonly valeursValides?: string[]
  ) {}
  get message() {
    const base = `La valeur "${this.valeur}" pour la question "${this.questionId}" (type ${this.questionType}) dans l'expression de ${this.ruleType} de l'action ${this.actionId} n'est pas valide`;
    if (this.valeursValides?.length) {
      return `${base}. Valeurs autorisées : ${this.valeursValides.join(', ')}`;
    }
    return base;
  }
}

export class ChampIdentiteInvalide {
  readonly _tag = 'ChampIdentiteInvalide';
  constructor(
    readonly actionId: string,
    readonly ruleType: string,
    readonly champ: string
  ) {}
  get message() {
    return `Le champ d'identité "${this.champ}" dans l'expression de ${this.ruleType} de l'action ${this.actionId} n'est pas valide. Champs autorisés : type, population, localisation, dans_aire_urbaine`;
  }
}

export class ValeurIdentiteInvalide {
  readonly _tag = 'ValeurIdentiteInvalide';
  constructor(
    readonly actionId: string,
    readonly ruleType: string,
    readonly champ: string,
    readonly valeur: string,
    readonly valeursValides: string[]
  ) {}
  get message() {
    return `La valeur "${this.valeur}" pour identite(${this.champ}) dans l'expression de ${this.ruleType} de l'action ${this.actionId} n'est pas valide. Valeurs autorisées : ${this.valeursValides.join(', ')}`;
  }
}

export class ScoreActionInconnue {
  readonly _tag = 'ScoreActionInconnue';
  constructor(
    readonly actionId: string,
    readonly ruleType: string,
    readonly referencedActionId: string
  ) {}
  get message() {
    return `L'action "${this.referencedActionId}" référencée dans score() de l'expression de ${this.ruleType} de l'action ${this.actionId} n'existe pas dans le référentiel`;
  }
}

export class ExpressionSyntaxeInvalide {
  readonly _tag = 'ExpressionSyntaxeInvalide';
  constructor(
    readonly actionId: string,
    readonly ruleType: string,
    readonly expression: string,
    readonly parseError: string
  ) {}
  get message() {
    return `L'expression de ${this.ruleType} "${this.expression}" de l'action ${this.actionId} contient une erreur de syntaxe : ${this.parseError}`;
  }
}

export class ScoreExpressionSyntaxeInvalide {
  readonly _tag = 'ScoreExpressionSyntaxeInvalide';
  constructor(
    readonly actionId: string,
    readonly expression: string,
    readonly parseError: string
  ) {}
  get message() {
    return `L'expression de score "${this.expression}" de l'action ${this.actionId} contient une erreur de syntaxe : ${this.parseError}`;
  }
}

export class IndicateurInconnu {
  readonly _tag = 'IndicateurInconnu';
  constructor(
    readonly actionId: string,
    readonly identifiant: string,
    readonly expressionOuListe: string
  ) {}
  get message() {
    return `L'indicateur "${this.identifiant}" référencé dans ${this.expressionOuListe} de l'action ${this.actionId} n'existe pas`;
  }
}

export class CibleLimiteManquante {
  readonly _tag = 'CibleLimiteManquante';
  constructor(
    readonly type: 'cible' | 'limite',
    readonly identifiantReferentiel: string,
    readonly expression: string,
    readonly actionId: string
  ) {}
  get message() {
    return `L'expression ${this.type} manquante pour l'indicateur "${this.identifiantReferentiel}" utilisé dans l'expression "${this.expression}" de l'action ${this.actionId}`;
  }
}

export type VerifyExpressionError =
  | ExpressionSyntaxeInvalide
  | ScoreExpressionSyntaxeInvalide
  | QuestionInconnue
  | ValeurIncoherente
  | ChampIdentiteInvalide
  | ValeurIdentiteInvalide
  | ScoreActionInconnue
  | IndicateurInconnu
  | CibleLimiteManquante;
