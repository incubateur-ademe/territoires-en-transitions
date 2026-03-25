import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import Markdown from '@/app/ui/Markdown';
import { Accordion, cn } from '@tet/ui';
import { TTOCItem } from './action-information.types';
import { useActionInfoData } from './use-action-information';

type Props = {
  item: TTOCItem;
  action: ActionDefinitionSummary;
};

const ActionInformationsItem = ({ item, action }: Props) => {
  const { id, label, num } = item;
  const titre = `${num}. ${label}`;
  const { data } = useActionInfoData(id, action);

  return (
    <Accordion
      title={titre}
      containerClassname="border-b-0"
      headerClassname="text-sm text-primary-8 font-[700]"
      content={
        <Markdown
          className="[&>*]:mb-2 mb-8"
          content={data ?? 'Cette section est vide.'}
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
