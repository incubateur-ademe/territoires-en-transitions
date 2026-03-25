'use client';

import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import Markdown from '@/app/ui/Markdown';
import { cn } from '@tet/ui';
import { ReactNode } from 'react';
import ActionInformationsItem from '../information/action-information.item';
import { getItems } from '../information/action-information.utils';

export function InformationsPanelContent({
  actionDefinition,
}: {
  actionDefinition: ActionDefinitionSummary;
}): ReactNode {
  const items = getItems(actionDefinition);

  return (
    <section>
      <Markdown
        content={actionDefinition.description}
        className="mb-8"
        options={{
          components: {
            p: ({ node, ...rest }) => (
              <p
                className={cn(rest.className, 'text-sm text-primary-9')}
                {...rest}
              />
            ),
          },
        }}
      />
      {items.map((item) => (
        <ActionInformationsItem
          key={item.id}
          item={item}
          action={actionDefinition}
        />
      ))}
    </section>
  );
}
