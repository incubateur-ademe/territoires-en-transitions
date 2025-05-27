import { RouterOutput } from '@/api/utils/trpc/client';
import { Card, List, ListElement, Title } from '@/app/ui/export-pdf/components';
import classNames from 'classnames';

type Props = {
  etapes: RouterOutput['plans']['fiches']['etapes']['list'] | undefined;
};

const Etapes = ({ etapes }: Props) => {
  if (!etapes || etapes.length === 0) return null;

  const etapesRealiseesCount = etapes.filter((etape) => etape.realise).length;

  return (
    <Card>
      <Title variant="h4" className="text-primary-8">
        Étapes ({etapesRealiseesCount}/{etapes.length})
      </Title>
      <List gap={3}>
        {etapes.map((etape) => (
          <ListElement
            key={etape.id}
            className={classNames({
              'text-grey-8': !etape.realise,
              'text-grey-7 line-through': etape.realise,
            })}
          >
            {etape.nom}
          </ListElement>
        ))}
      </List>
    </Card>
  );
};

export default Etapes;
