import { INestApplication } from '@nestjs/common';
import {
  ActionDefinitionTemplates,
  actionDefinitionTable,
} from '@tet/backend/referentiels/models/action-definition.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TemplatedActionField } from '@tet/domain/referentiels';
import { eq } from 'drizzle-orm';
import { renderActionTextTemplateForVariant } from './action-text-template-condition.visitor';
import { parseActionTextTemplate } from './action-text-template.rules';
import { TEMPLATE_REFERENCE_VARIANT } from './action-text-variant.rules';
import { RenderActionTextsService } from './render-action-texts.service';

/** Région DROM (Guyane), pour créer une collectivité de test DOM */
export const DROM_REGION_CODE = '03';

/**
 * Balise des textes d'une action comme le ferait l'import : `templates` reçoit
 * les sources, les colonnes le rendu par défaut. Vide le cache des surcharges,
 * puisque la version du référentiel ne change pas.
 *
 * Le référentiel est partagé : les specs qui balisent une même action ne
 * doivent pas tourner en parallèle. Passer la fonction renvoyée à
 * `onTestFinished` pour tout restaurer.
 */
export async function setActionTemplatesForTest(
  app: INestApplication,
  {
    actionId,
    templates,
  }: { actionId: string; templates: ActionDefinitionTemplates }
): Promise<() => Promise<void>> {
  const { db } = app.get(DatabaseService);
  const renderService = app.get(RenderActionTextsService);

  const [previous] = await db
    .select()
    .from(actionDefinitionTable)
    .where(eq(actionDefinitionTable.actionId, actionId));
  if (!previous) {
    throw new Error(`Action ${actionId} introuvable`);
  }

  const defaultTexts: Partial<Record<TemplatedActionField, string>> = {};
  for (const [field, source] of Object.entries(templates) as Array<
    [TemplatedActionField, string]
  >) {
    const parsed = parseActionTextTemplate(source);
    if (!parsed.success) {
      throw new Error(parsed.error);
    }
    defaultTexts[field] = renderActionTextTemplateForVariant(
      parsed.template,
      TEMPLATE_REFERENCE_VARIANT
    );
  }

  await db
    .update(actionDefinitionTable)
    .set({ ...defaultTexts, templates })
    .where(eq(actionDefinitionTable.actionId, actionId));
  renderService.clearCacheForTests();

  return async () => {
    const { modifiedAt: _modifiedAt, ...restored } = previous;
    await db
      .update(actionDefinitionTable)
      .set(restored)
      .where(eq(actionDefinitionTable.actionId, actionId));
    renderService.clearCacheForTests();
  };
}
