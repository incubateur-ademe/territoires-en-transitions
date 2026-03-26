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
};

const ActionInformationsItem = ({ item, action }: Props) => {
  const { property, label, num } = item;
  const titre = `${num}. ${label}`;

  return (
    <Accordion
      title={titre}
      containerClassname="border-b-0"
      content={
        <Markdown
          className="paragraphe-16 [&>*]:mb-2 mb-8"
          content={action[property] ?? 'Cette section est vide.'}
          openLinksInNewTab
        />
      }
    />
  );
};

export default ActionInformationsItem;
