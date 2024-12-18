import React from 'react';

import { Card, Stack, Title } from '@/app/ui/export-pdf/components';

import { RouterOutput } from '@/api/utils/trpc/client';
import classNames from 'classnames';
import { Text } from '@react-pdf/renderer';
import { tw } from '@/app/ui/export-pdf/utils';

const EtapesCard = () => {
  <Card wrap={false}>
    <Title variant="h4" className="text-primary-8">
      Indicateurs de suivi
    </Title>
  </Card>;
};

type Props = {
  etapes: RouterOutput['plans']['fiches']['etapes']['list'];
};

const Etapes = ({ etapes }: Props) => {
  const etapesRealiseesCount = etapes.filter((etape) => etape.realise).length;

  return (
    <Card wrap={false}>
      <Title variant="h4" className="text-primary-8">
        Étapes {etapes.length > 0 && `${etapesRealiseesCount}/${etapes.length}`}
      </Title>
      <Stack gap={3}>
        {etapes.map((etape) => (
          <Stack
            key={etape.id}
            gap={2}
            className="w-[95%] flex-row items-start text-xs text-grey-8 leading-6"
          >
            <Text style={tw('ml-1')}>•</Text>
            <Text
              style={tw(
                classNames({
                  'line-through !text-grey-6': etape.realise,
                })
              )}
            >
              {etape.nom}
            </Text>
          </Stack>
        ))}
      </Stack>
    </Card>
  );
};

export default Etapes;
