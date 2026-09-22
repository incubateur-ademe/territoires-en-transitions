import { appLabels } from '@/app/labels/catalog';
import { Badge, Card } from '@tet/ui';
import { JSX } from 'react';
import { LevierCard } from './to-levier-cards';

export const LevierSummaryCard = ({
  levier,
}: {
  levier: LevierCard;
}): JSX.Element => (
  <Card className="h-full">
    <h2 className="mb-0 text-lg">{levier.nom}</h2>
    <Badge title={levier.secteur} size="sm" type="outlined" uppercase={false} />
    <p className="mb-0 text-sm font-normal text-grey-8">
      {appLabels.pertinenceDuLevier(levier.pertinence)}
    </p>
    <p className="mb-0 text-sm font-normal text-grey-8">
      {appLabels.actionsRattachees({ count: levier.ficheCount })}
    </p>
  </Card>
);
