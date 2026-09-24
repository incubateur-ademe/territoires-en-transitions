import { appLabels } from '@/app/labels/catalog';
import { Badge, Card } from '@tet/ui';
import { JSX } from 'react';
import { CategoriesAccordion } from './categories.accordion';
import { UpsertPertinence } from './data/use-upsert-pertinence';
import { LevierCardInfo } from './levier-card-info';
import { PertinenceField } from './pertinence-field';
import { LevierCard } from './to-levier-cards';

type LevierSummaryCardProps = {
  levier: LevierCard;
  upsertPertinence?: UpsertPertinence;
};

export const LevierSummaryCard = ({
  levier,
  upsertPertinence,
}: LevierSummaryCardProps): JSX.Element => (
  <Card>
    <h2 className="mb-0 text-lg">{levier.nom}</h2>
    <Badge title={levier.secteur} size="sm" type="outlined" />
    <PertinenceField
      levier={levier}
      pertinence={levier.pertinence}
      upsertPertinence={upsertPertinence}
    />
    <LevierCardInfo>
      {appLabels.actionsRattachees({ count: levier.ficheCount })}
    </LevierCardInfo>
    <CategoriesAccordion levier={levier} upsertPertinence={upsertPertinence} />
  </Card>
);
