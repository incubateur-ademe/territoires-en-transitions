import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import Markdown from '@/app/ui/Markdown';
import { Accordion } from '@tet/ui';

type Props = {
  item: {
    property: keyof Pick<
      ActionListItem,
      | 'description'
      | 'contexte'
      | 'exemples'
      | 'ressources'
      | 'perimetreEvaluation'
    >;
    label: string;
    num: number;
  };
  action: ActionListItem;
  isOpen?: boolean;
};

const ActionInformationsItem = ({ item, action, isOpen }: Props) => {
  const { property, label, num } = item;
  const titre = `${num}. ${label}`;

  return (
    <Accordion
      title={titre}
      containerClassname="border-y-0"
      headerClassname="text-sm text-primary-8 font-[700] py-2 hover:bg-primary-1"
      initialState={isOpen}
      content={
        <Markdown
          className="mb-8 [&>*]:mb-2 [&>*]:text-sm [&>*]:text-primary-9"
          content={action[property] ?? 'Cette section est vide.'}
          openLinksInNewTab
        />
      }
    />
  );
};

export default ActionInformationsItem;
