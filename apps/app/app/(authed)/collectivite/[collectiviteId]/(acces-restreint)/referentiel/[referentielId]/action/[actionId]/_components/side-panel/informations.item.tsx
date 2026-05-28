import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import Markdown from '@/app/ui/Markdown';
import { AccordionControlled } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { ActionInfoSection } from './informations.config';

type Props = {
  item: ActionInfoSection & { num: number };
  action: ActionListItem;
  openState: OpenState;
};

export const ActionInformationsItem = ({ item, action, openState }: Props) => {
  const { sectionId, label, num } = item;
  const titre = `${num}. ${label}`;

  return (
    <AccordionControlled
      title={titre}
      containerClassname="border-y-0"
      headerClassname="text-sm text-primary-8 font-[700] py-2 hover:bg-primary-1"
      expanded={openState.isOpen}
      setExpanded={openState.setIsOpen}
      content={
        <Markdown
          className="mb-2 [&>*]:mb-2 [&>*]:text-sm [&>*]:text-primary-9"
          content={
            action[sectionId]?.replaceAll('\n', '\n\n') ??
            'Cette section est vide.'
          }
          openLinksInNewTab
        />
      }
    />
  );
};
