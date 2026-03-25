'use client';

import {
  DEPRECATED_useActionDefinition,
  useAction,
} from '@/app/referentiels/actions/action-context';
import { ActionAuditDetail } from '@/app/referentiels/audits/ActionAuditDetail';
import {
  ActionDefinitionSummary,
  useSortedActionSummaryChildren,
} from '@/app/referentiels/referentiel-hooks';
import ScrollTopButton from '@/app/ui/buttons/ScrollTopButton';
import { StickyHeaderHeightProvider } from '@/app/ui/layout/HeaderSticky';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Spacer } from '@tet/ui';
import { ActionJustificationField } from './action/action.justification-field';
import { useDisplaySettings } from './display-settings.context';
import { ActionHeader } from './header/action.header';
import { SubActionCardsList } from './subaction/subaction.cards-list';
export const ActionView = () => {
  const actionDefinition = DEPRECATED_useActionDefinition();
  const { data: action, isPending } = useAction();

  if (isPending || !actionDefinition) {
    return <SpinnerLoader className="m-auto" />;
  }

  if (!action) return null;

  return (
    <StickyHeaderHeightProvider>
      <div
        data-test={`Action-${actionDefinition.identifiant}`}
        className="grow flex flex-col"
      >
        <ActionHeader actionDefinition={actionDefinition} action={action} />
        <Spacer height={2} />
        <div className="grow flex flex-col">
          <ActionDetailContent action={actionDefinition} />
        </div>
        <Spacer height={2} />
        <ScrollTopButton />
      </div>
    </StickyHeaderHeightProvider>
  );
};

/**
 * Contenu de l'onglet "Suivi de l'action" du menu
 * "Référentiel CAE / ECI" de la page "État des lieux"
 */
function ActionDetailContent({ action }: { action: ActionDefinitionSummary }) {
  const subActions = useSortedActionSummaryChildren(action);
  const { showJustifications, actionsAreAllExpanded } = useDisplaySettings();

  return (
    <section>
      <div className="flex flex-col">
        <ActionAuditDetail action={action} />
        {showJustifications && (
          <>
            <Spacer height={1} />
            <div className=" bg-white p-4 rounded-lg">
              <ActionJustificationField
                actionId={action.id}
                title="Explications sur l'état d'avancement :"
                className="min-h-20"
              />
            </div>
          </>
        )}
        <Spacer height={1} />
      </div>

      {subActions.actions.length > 0 && (
        <SubActionCardsList
          sortedSubActions={subActions.sortedActions}
          showJustifications={showJustifications}
          actionsAreAllExpanded={actionsAreAllExpanded}
        />
      )}
    </section>
  );
}
