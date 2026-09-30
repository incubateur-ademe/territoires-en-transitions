import { appLabels } from '@/app/labels/catalog';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import type { ActionDeReference } from '@tet/domain/shared';
import { createElement, useCallback } from 'react';
import type { UseUpdateActionDeReferenceSidePanel } from './actions-de-reference.contract';
import { UpdateActionDeReferenceForm } from './update-action-de-reference.form';

const useUpdateActionDeReferenceSidePanel: UseUpdateActionDeReferenceSidePanel =
  () => {
    const { setPanel } = useSidePanel();

    const open = useCallback(
      (action: ActionDeReference): void => {
        setPanel({
          type: 'open',
          title: appLabels.actionDeReferenceModificationTitre,
          content: createElement(UpdateActionDeReferenceForm, {
            key: action.id,
            action,
            onUpdated: () => setPanel({ type: 'close' }),
          }),
        });
      },
      [setPanel]
    );

    return { open };
  };

export { useUpdateActionDeReferenceSidePanel };
