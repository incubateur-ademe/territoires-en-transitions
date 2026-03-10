import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import Markdown from '@/app/ui/Markdown';
import { Accordion, cn } from '@tet/ui';

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
      headerClassname="text-sm text-primary-8 font-[700]"
      content={
        <Markdown
          className="[&>*]:mb-2 mb-8"
          content={action[property] ?? 'Cette section est vide.'}
          openLinksInNewTab
          options={{
            components: {
              p: ({ node, ...rest }) => (
                <p
                  {...rest}
                  className={cn(rest.className, 'text-sm text-primary-9')}
                />
              ),
            },
          }}
        />
      }
    />
  );
};

export default ActionInformationsItem;
