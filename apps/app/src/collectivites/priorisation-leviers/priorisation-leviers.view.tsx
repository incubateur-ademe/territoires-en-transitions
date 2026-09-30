'use client';

import { appLabels } from '@/app/labels/catalog';
import { LoadingStatus } from '@/app/ui/shared/loading-status';
import { ErrorCard } from '@/app/utils/error/error.card';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Alert, PageHeader, VisibleWhen } from '@tet/ui';
import { JSX } from 'react';
import { match } from 'ts-pattern';
import { LevierCardsQuery, useLevierCards } from './data/use-levier-cards';
import {
  UpsertPertinence,
  useUpsertPertinence,
} from './data/use-upsert-pertinence';
import { LevierSummaryCard } from './levier-summary.card';
import { LevierCard } from './to-levier-cards';

const LevierCardList = ({
  cards,
  upsertPertinence,
}: {
  cards: LevierCard[];
  upsertPertinence?: UpsertPertinence;
}): JSX.Element => (
  <ul role="list" className="m-0 flex max-w-2xl list-none flex-col gap-4 p-0">
    {cards.map((card) => (
      <li key={card.levierId} className="p-0">
        <LevierSummaryCard levier={card} upsertPertinence={upsertPertinence} />
      </li>
    ))}
  </ul>
);

const LevierCardsContent = ({
  levierCards,
  upsertPertinence,
}: {
  levierCards: LevierCardsQuery;
  upsertPertinence?: UpsertPertinence;
}): JSX.Element =>
  match(levierCards)
    .with({ status: 'loading' }, () => <LoadingStatus />)
    .with({ status: 'error' }, ({ retry }) => (
      <ErrorCard title={appLabels.uneErreurEstSurvenue} retry={retry} />
    ))
    .with({ status: 'ready' }, ({ cards, hasMobilisation }) => (
      <div className="flex flex-col gap-6">
        <VisibleWhen condition={!hasMobilisation}>
          <Alert title={appLabels.mobilisationAbsente} />
        </VisibleWhen>
        <LevierCardList cards={cards} upsertPertinence={upsertPertinence} />
      </div>
    ))
    .exhaustive();

export const PriorisationLeviersView = (): JSX.Element => {
  const { collectiviteId } = useCurrentCollectivite();
  const levierCards = useLevierCards(collectiviteId);
  const upsertPertinence = useUpsertPertinence();

  return (
    <>
      <PageHeader>
        <PageHeader.Title>
          {appLabels.priorisationLeviersTitre}
        </PageHeader.Title>
      </PageHeader>
      <LevierCardsContent
        levierCards={levierCards}
        upsertPertinence={upsertPertinence}
      />
    </>
  );
};
