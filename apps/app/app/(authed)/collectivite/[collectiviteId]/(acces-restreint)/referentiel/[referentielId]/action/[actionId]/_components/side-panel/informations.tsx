'use client';

import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import Markdown from '@/app/ui/Markdown';
import { ReactNode } from 'react';
import ActionInformationsItem from '../information/action-information.item';

export function InformationsPanelContent({
  action,
}: {
  action: ActionListItem;
}): ReactNode {
  return (
    <section>
      <Markdown content={action.description} className="paragraphe-16 mb-8" />

      {action.description.length > 0 && (
        <ActionInformationsItem
          item={{
            property: 'description',
            label: 'Description',
            num: 1,
          }}
          action={action}
        />
      )}
      {action.contexte.length > 0 && (
        <ActionInformationsItem
          item={{
            property: 'contexte',
            label: 'Contexte et réglementation',
            num: 2,
          }}
          action={action}
        />
      )}
      {action.exemples.length > 0 && (
        <ActionInformationsItem
          item={{
            property: 'exemples',
            label: 'Exemples d’autres collectivités',
            num: 3,
          }}
          action={action}
        />
      )}
      {action.ressources.length > 0 && (
        <ActionInformationsItem
          item={{
            property: 'ressources',
            label: 'Ressources',
            num: 4,
          }}
          action={action}
        />
      )}
      {action.perimetreEvaluation.length > 0 && (
        <ActionInformationsItem
          item={{
            property: 'perimetreEvaluation',
            label: 'Précisions évaluation',
            num: 5,
          }}
          action={action}
        />
      )}
    </section>
  );
}
