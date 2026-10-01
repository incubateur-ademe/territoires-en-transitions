import {
  getExpressionVisitor,
  tokenizeAndParse,
} from '@tet/backend/utils/expression-parser';
import { PersonnalisationExpressionReferences } from '@tet/backend/referentiels/import-referentiel/verify-referentiel-expressions.types';
import { parser } from './personnalisations-expression.service';

/**
 * Valeur littérale d'un argument `primary`, telle qu'écrite : `oui` reste
 * `oui` au lieu de devenir le booléen que rendrait le visitor d'évaluation.
 */
export function extractRawTokenValue(primaryNode: any): string {
  const children = primaryNode.children;
  if (children.OUI) return String(children.OUI[0].image);
  if (children.NON) return String(children.NON[0].image);
  if (children.VRAI) return String(children.VRAI[0].image);
  if (children.FAUX) return String(children.FAUX[0].image);
  if (children.CNAME) return String(children.CNAME[0].image);
  if (children.NUMBER) return String(children.NUMBER[0].image);
  return '';
}

class PersonnalisationExpressionReferenceExtractor extends getExpressionVisitor(
  parser.getBaseCstVisitorConstructorWithDefaults()
) {
  public questions: PersonnalisationExpressionReferences['questions'] = [];
  public identiteFields: PersonnalisationExpressionReferences['identiteFields'] =
    [];
  public scores: PersonnalisationExpressionReferences['scores'] = [];
  public demarches: PersonnalisationExpressionReferences['demarches'] = [];

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
      }
      if (ctx.reponse) {
        return this.visit(ctx.reponse);
      }
      if (ctx.score) {
        return this.visit(ctx.score);
      }
      if (ctx.demarche) {
        return this.visit(ctx.demarche);
      }
    }
  }

  reponse(ctx: any) {
    const questionId = String(this.visit(ctx.identifier));
    if (ctx.primary) {
      const valeur = extractRawTokenValue(ctx.primary[0]);
      this.questions.push({ questionId, valeur });
      return null;
    }
    this.questions.push({ questionId });
    return null;
  }

  identite(ctx: any) {
    const champ = String(this.visit(ctx.identifier));
    const valeur = extractRawTokenValue(ctx.primary[0]);
    this.identiteFields.push({ champ, valeur });
    return null;
  }

  score(ctx: any) {
    const actionId = String(this.visit(ctx.identifier));
    this.scores.push({ actionId });
    return null;
  }

  demarche(ctx: any) {
    const champ = String(this.visit(ctx.identifier));
    this.demarches.push({ champ });
    return null;
  }
}

export function extractReferencesFromExpression(
  formula: string
): PersonnalisationExpressionReferences {
  const cst = tokenizeAndParse(parser, formula);

  const extractor = new PersonnalisationExpressionReferenceExtractor();
  extractor.visit(cst);

  return {
    questions: extractor.questions,
    identiteFields: extractor.identiteFields,
    scores: extractor.scores,
    demarches: extractor.demarches,
  };
}
