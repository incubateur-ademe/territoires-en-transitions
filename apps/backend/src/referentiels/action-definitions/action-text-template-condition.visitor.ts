import {
  parser,
  PersonnalisationsExpressionVisitor,
} from '@tet/backend/collectivites/personnalisations/services/personnalisations-expression.service';
import { tokenizeAndParse } from '@tet/backend/utils/expression-parser';
import { evaluateIdentite } from '@tet/backend/utils/expression-parser/evaluate-identite';
import { getErrorMessage } from '@tet/domain/utils';
import { CstNode } from 'chevrotain';
import {
  ActionTextTemplate,
  renderActionTextTemplate,
} from './action-text-template.rules';
import {
  buildTemplateIdentite,
  isTemplateVariantField,
  TEMPLATE_VARIANT_FIELDS,
  TemplateVariant,
} from './action-text-variant.rules';

/**
 * Alias utilisables seuls dans une condition : `{{si dom}}`. Un nom d'alias ne
 * doit être ni un mot-clé du DSL (`si`, `ou`, `et`, `non`…), ni un champ
 * d'identité (voir la spec).
 */
export const TEMPLATE_CONDITION_ALIASES = {
  dom: 'identite(localisation, dom)',
  metropole: 'identite(localisation, metropole)',
} as const satisfies Record<string, string>;

const ALIAS_NAMES = Object.keys(TEMPLATE_CONDITION_ALIASES).join(', ');

export class InvalidActionTextConditionError extends Error {
  override name = 'InvalidActionTextConditionError';
}

function isAlias(
  name: string
): name is keyof typeof TEMPLATE_CONDITION_ALIASES {
  return Object.hasOwn(TEMPLATE_CONDITION_ALIASES, name);
}

/**
 * Évalue une condition de balise. Par rapport au visiteur de personnalisation :
 * - un identifiant seul en position de condition est un alias (`dom`), résolu
 *   sur l'arbre et non par remplacement de texte : dans
 *   `identite(localisation, dom)`, `dom` reste une valeur ;
 * - seuls `identite(champ, valeur)` sur un champ de variante et les opérateurs
 *   logiques sont acceptés : `reponse`, `score`, `referentiel`, `demarche`,
 *   `min` et `max` sont refusés, car le texte ne doit dépendre que du profil
 *   de la collectivité.
 */
class ActionTextConditionVisitor extends PersonnalisationsExpressionVisitor {
  /** Profondeur dans les arguments d'un appel de fonction */
  private callArgsDepth = 0;

  call(ctx: any) {
    if (ctx.primary) {
      return this.visit(ctx.primary);
    }
    if (ctx.identite) {
      return this.visit(ctx.identite);
    }
    throw new InvalidActionTextConditionError(
      'seule la fonction identite(champ, valeur) est autorisée dans une balise'
    );
  }

  identite(ctx: any) {
    const field = this.visit(ctx.identifier) as string;
    if (!isTemplateVariantField(field)) {
      throw new InvalidActionTextConditionError(
        `identite(${field}, …) : le champ « ${field} » n’est pas utilisable dans une balise (champs possibles : ${Object.keys(
          TEMPLATE_VARIANT_FIELDS
        ).join(', ')})`
      );
    }

    this.callArgsDepth++;
    let value: unknown;
    try {
      value = this.visit(ctx.primary);
    } finally {
      this.callArgsDepth--;
    }

    const allowedValues: readonly string[] =
      TEMPLATE_VARIANT_FIELDS[field].values;
    const normalizedValue = String(value).toLowerCase();
    if (!allowedValues.includes(normalizedValue)) {
      throw new InvalidActionTextConditionError(
        `identite(${field}, ${String(
          value
        )}) : valeur inconnue (valeurs possibles : ${allowedValues.join(', ')})`
      );
    }
    return evaluateIdentite(this.identiteCollectivite, field, normalizedValue);
  }

  primary(ctx: any) {
    if (ctx.CNAME && this.callArgsDepth === 0) {
      const name = ctx.CNAME[0].image as string;
      const alias = name.toLowerCase();
      if (!isAlias(alias)) {
        throw new InvalidActionTextConditionError(
          `« ${name} » n’est pas une condition connue (alias possibles : ${ALIAS_NAMES})`
        );
      }
      return this.visit(parseCondition(TEMPLATE_CONDITION_ALIASES[alias]));
    }
    return super.primary(ctx);
  }
}

const parsedConditions = new Map<string, CstNode>();

function parseCondition(condition: string): CstNode {
  const cached = parsedConditions.get(condition);
  if (cached) {
    return cached;
  }
  let cst: CstNode;
  try {
    cst = tokenizeAndParse(parser, condition);
  } catch (error) {
    throw new InvalidActionTextConditionError(
      `condition « ${condition} » invalide : ${getErrorMessage(error)}`
    );
  }
  parsedConditions.set(condition, cst);
  return cst;
}

/**
 * Évalue une condition de balise pour un profil. Lève
 * `InvalidActionTextConditionError` si la condition est invalide.
 */
export function evaluateActionTextCondition(
  condition: string,
  variant: TemplateVariant
): boolean {
  const cst = parseCondition(condition);
  const visitor = new ActionTextConditionVisitor();
  visitor.identiteCollectivite = buildTemplateIdentite(variant);

  let result: unknown;
  try {
    result = visitor.visit(cst);
  } catch (error) {
    if (error instanceof InvalidActionTextConditionError) {
      throw new InvalidActionTextConditionError(
        `{{si ${condition}}} : ${error.message}`
      );
    }
    throw new InvalidActionTextConditionError(
      `{{si ${condition}}} : ${getErrorMessage(error)}`
    );
  }
  if (typeof result !== 'boolean') {
    throw new InvalidActionTextConditionError(
      `{{si ${condition}}} : la condition doit valoir vrai ou faux`
    );
  }
  return result;
}

/** Rend un texte balisé pour un profil. */
export function renderActionTextTemplateForVariant(
  template: ActionTextTemplate,
  variant: TemplateVariant
): string {
  return renderActionTextTemplate(template, (condition) =>
    evaluateActionTextCondition(condition, variant)
  );
}
