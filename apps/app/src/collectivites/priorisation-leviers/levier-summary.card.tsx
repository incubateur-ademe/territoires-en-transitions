import { appLabels } from '@/app/labels/catalog';
import { Badge, Card } from '@tet/ui';
import { JSX, ReactNode } from 'react';
import { UpsertPertinence } from './data/use-upsert-pertinence';
import { PertinenceSelector } from './pertinence-selector';
import { LevierCard } from './to-levier-cards';

type LevierSummaryCardProps = {
  levier: LevierCard;
  upsertPertinence?: UpsertPertinence;
};

const LevierCardInfo = ({ children }: { children: ReactNode }): JSX.Element => (
  <p className="mb-0 text-sm font-normal text-grey-8">{children}</p>
);

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
        {appLabels.pertinenceDuLevier(levier.pertinence)}
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
  <Card className="h-full">
    <h2 className="mb-0 text-lg">{levier.nom}</h2>
    <Badge title={levier.secteur} size="sm" type="outlined" uppercase={false} />
    <LevierPertinence levier={levier} upsertPertinence={upsertPertinence} />
    <LevierCardInfo>
      {appLabels.actionsRattachees({ count: levier.ficheCount })}
    </LevierCardInfo>
  </Card>
);
