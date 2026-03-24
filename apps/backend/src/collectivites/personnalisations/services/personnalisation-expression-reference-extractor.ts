import { getExpressionVisitor } from '@tet/backend/utils/expression-parser';
import { PersonnalisationExpressionReferences } from '@tet/domain/referentiels';
import { parser } from './personnalisations-expression.service';

function extractRawTokenValue(primaryNode: any): string {
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
}

export function extractReferencesFromExpression(
  formula: string
): PersonnalisationExpressionReferences {
  const lexingResult = parser.lexer.tokenize(formula);
  parser.input = lexingResult.tokens;
  const cst = parser.statement();

  const extractor = new PersonnalisationExpressionReferenceExtractor();
  extractor.visit(cst);

  return {
    questions: extractor.questions,
    identiteFields: extractor.identiteFields,
    scores: extractor.scores,
  };
}
