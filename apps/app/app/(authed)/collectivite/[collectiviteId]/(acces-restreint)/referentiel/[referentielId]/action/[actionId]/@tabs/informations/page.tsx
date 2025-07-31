'use client';

import { DEPRECATED_useActionDefinition } from '@/app/referentiels/actions/action-context';
import Markdown from '@/app/ui/Markdown';
import ActionInformationsItem from '../../_components/information/action-information.item';
import { getItems } from '../../_components/information/action-information.utils';

export default function Page() {
  const actionDefinition = DEPRECATED_useActionDefinition();

  if (!actionDefinition) return null;

  const items = getItems(actionDefinition);

  return (
    <section>
      <Markdown
        content={actionDefinition.description}
        className="paragraphe-16 mb-8"
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
