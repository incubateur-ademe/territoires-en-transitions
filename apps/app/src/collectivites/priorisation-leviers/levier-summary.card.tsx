import { appLabels } from '@/app/labels/catalog';
import { Badge, Card } from '@tet/ui';
import { JSX } from 'react';
import { CategoriesAccordion } from './categories.accordion';
import { UpsertPertinence } from './data/use-upsert-pertinence';
import { LevierCardInfo } from './levier-card-info';
import { PertinenceSelector } from './pertinence-selector';
import { LevierCard } from './to-levier-cards';

type LevierSummaryCardProps = {
  levier: LevierCard;
  upsertPertinence?: UpsertPertinence;
};

const LevierPertinence = ({
  levier,
  upsertPertinence,
}: {
  levier: Pick<LevierCard, 'levierId' | 'nom' | 'pertinence'>;
  upsertPertinence?: UpsertPertinence;
}): JSX.Element => {
  if (upsertPertinence === undefined) {
    return (
      <LevierCardInfo>
        {appLabels.pertinenceInfo(levier.pertinence)}
      </LevierCardInfo>
    );
  }
  return (
    <PertinenceSelector
      label={appLabels.pertinenceLevierLabel(levier.nom)}
      value={levier.pertinence}
      onChange={(pertinence) =>
        upsertPertinence({ levierId: levier.levierId, pertinence })
      }
    />
  );
};

export const LevierSummaryCard = ({
  levier,
  upsertPertinence,
}: LevierSummaryCardProps): JSX.Element => (
  <Card>
    <h2 className="mb-0 text-lg">{levier.nom}</h2>
    <Badge title={levier.secteur} size="sm" type="outlined" />
    <LevierPertinence levier={levier} upsertPertinence={upsertPertinence} />
    <LevierCardInfo>
      {appLabels.actionsRattachees({ count: levier.ficheCount })}
    </LevierCardInfo>
    <CategoriesAccordion categories={levier.categories} />
  </Card>
);
