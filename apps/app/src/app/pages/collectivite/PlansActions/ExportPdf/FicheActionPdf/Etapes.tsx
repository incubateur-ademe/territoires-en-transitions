import { RouterOutput } from '@/api';
import {
  Divider,
  List,
  ListElement,
  Stack,
  Title,
} from '@/app/ui/export-pdf/components';
import classNames from 'classnames';

type Props = {
  etapes: RouterOutput['plans']['fiches']['etapes']['list'] | undefined;
};

const Etapes = ({ etapes }: Props) => {
  if (!etapes || etapes.length === 0) return null;

  const etapesRealiseesCount = etapes.filter((etape) => etape.realise).length;

  return (
    <>
      <Divider className="mt-2" />
      <Stack>
        <Title variant="h5" className="text-primary-8 uppercase">
          Étapes ({etapesRealiseesCount}/{etapes.length})
        </Title>
        <List gap={1.5}>
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
      </Stack>
    </>
  );
};

export default Etapes;
