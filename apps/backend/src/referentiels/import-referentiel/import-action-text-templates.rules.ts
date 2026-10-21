import {
  evaluateActionTextCondition,
  renderActionTextTemplateForVariant,
} from '@tet/backend/referentiels/action-definitions/action-text-template-condition.visitor';
import {
  ActionTextTemplate,
  hasTemplateMarkup,
  listActionTextTemplateConditions,
  parseActionTextTemplate,
} from '@tet/backend/referentiels/action-definitions/action-text-template.rules';
import {
  isReferenceVariant,
  listTemplateVariants,
  TEMPLATE_REFERENCE_VARIANT,
  TEMPLATE_VARIANT_FIELDS,
  TemplateVariant,
  TemplateVariantField,
} from '@tet/backend/referentiels/action-definitions/action-text-variant.rules';
import { ActionDefinitionTemplates } from '@tet/backend/referentiels/models/action-definition.table';
import { getErrorMessage } from '@tet/domain/utils';
import {
  TEMPLATED_ACTION_FIELDS,
  TemplatedActionField,
} from '@tet/domain/referentiels';

type ActionTexts = Partial<Record<TemplatedActionField, string | null>>;

/** Rendu d'un champ balisé, regroupé par texte identique */
export type ActionTextVariantPreview = {
  actionId: string;
  field: TemplatedActionField;
  variants: Array<{
    /** Profils qui voient ce texte, par ex. « Métropole (par défaut) » */
    label: string;
    text: string;
  }>;
};

export type VerifyActionTextTemplatesResult = {
  errors: string[];
  warnings: string[];
  previews: ActionTextVariantPreview[];
};

const VARIANT_VALUE_LABELS: Record<
  TemplateVariantField,
  Record<string, string>
> = {
  localisation: { metropole: 'Métropole', dom: 'DOM' },
};

function getVariantLabel(variant: TemplateVariant): string {
  const label = (Object.keys(TEMPLATE_VARIANT_FIELDS) as TemplateVariantField[])
    .map(
      (field) => VARIANT_VALUE_LABELS[field][variant[field]] ?? variant[field]
    )
    .join(', ');
  return isReferenceVariant(variant) ? `${label} (par défaut)` : label;
}

function renderAllVariants(
  template: ActionTextTemplate
): Array<{ variant: TemplateVariant; text: string }> {
  return listTemplateVariants().map((variant) => ({
    variant,
    text: renderActionTextTemplateForVariant(template, variant),
  }));
}

/**
 * Vérifie les textes balisés d'un référentiel à importer :
 * - erreurs : balises mal formées, condition invalide, `nom` vide pour un
 *   profil ;
 * - avertissements : balise sans effet (toutes les variantes identiques) ou
 *   condition qui vaut toujours la même chose ;
 * - aperçu : le texte vu par chaque profil, pour relecture par l'éditeur.
 */
export function verifyActionTextTemplates(
  actions: Array<ActionTexts & { actionId: string }>
): VerifyActionTextTemplatesResult {
  const result: VerifyActionTextTemplatesResult = {
    errors: [],
    warnings: [],
    previews: [],
  };

  for (const action of actions) {
    const { actionId } = action;
    for (const field of TEMPLATED_ACTION_FIELDS) {
      const source = action[field];
      if (!source || !hasTemplateMarkup(source)) {
        continue;
      }
      const label = `L'action ${actionId}, colonne ${field}`;

      const parsed = parseActionTextTemplate(source);
      if (!parsed.success) {
        result.errors.push(`${label} : ${parsed.error}`);
        continue;
      }

      let rendered: Array<{ variant: TemplateVariant; text: string }>;
      try {
        rendered = renderAllVariants(parsed.template);
      } catch (error) {
        result.errors.push(`${label} : ${getErrorMessage(error)}`);
        continue;
      }

      if (field === 'nom') {
        for (const { variant, text } of rendered) {
          if (!text.trim()) {
            result.errors.push(
              `${label} : le nom est vide pour le profil ${getVariantLabel(
                variant
              )}`
            );
          }
        }
      }

      if (new Set(rendered.map(({ text }) => text)).size === 1) {
        result.warnings.push(
          `${label} : les balises n’ont aucun effet, le texte est le même pour tous les profils`
        );
      }
      for (const condition of listActionTextTemplateConditions(
        parsed.template
      )) {
        const values = new Set(
          listTemplateVariants().map((variant) =>
            evaluateActionTextCondition(condition, variant)
          )
        );
        if (values.size === 1) {
          result.warnings.push(
            `${label} : la condition {{si ${condition}}} vaut toujours ${
              values.has(true) ? 'vrai' : 'faux'
            }`
          );
        }
      }

      const variantsByText = new Map<string, TemplateVariant[]>();
      for (const { variant, text } of rendered) {
        variantsByText.set(text, [
          ...(variantsByText.get(text) ?? []),
          variant,
        ]);
      }
      result.previews.push({
        actionId,
        field,
        variants: [...variantsByText].map(([text, variants]) => ({
          label: variants.map(getVariantLabel).join(' / '),
          text,
        })),
      });
    }
  }
  return result;
}

/**
 * Colonnes de texte à enregistrer pour une action : le rendu par défaut dans
 * chaque colonne, et dans `templates` les sources des seuls champs balisés
 * (`null` si aucun). Les textes doivent avoir passé `verifyActionTextTemplates`.
 */
export function buildActionTextColumns(action: ActionTexts): {
  texts: Partial<Record<TemplatedActionField, string>>;
  templates: ActionDefinitionTemplates | null;
} {
  const texts: Partial<Record<TemplatedActionField, string>> = {};
  const templates: ActionDefinitionTemplates = {};
  for (const field of TEMPLATED_ACTION_FIELDS) {
    const source = action[field];
    if (!source || !hasTemplateMarkup(source)) {
      continue;
    }
    const parsed = parseActionTextTemplate(source);
    if (!parsed.success) {
      throw new Error(parsed.error);
    }
    texts[field] = renderActionTextTemplateForVariant(
      parsed.template,
      TEMPLATE_REFERENCE_VARIANT
    );
    templates[field] = source;
  }
  return {
    texts,
    templates: Object.keys(templates).length > 0 ? templates : null,
  };
}
