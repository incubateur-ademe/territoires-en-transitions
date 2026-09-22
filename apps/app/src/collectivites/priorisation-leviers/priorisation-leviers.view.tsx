'use client';

import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Alert, PageHeader, VisibleWhen } from '@tet/ui';
import { JSX } from 'react';
import { match } from 'ts-pattern';
import { LevierCardsQuery, useLevierCards } from './data/use-levier-cards';
import { LevierSummaryCard } from './levier-summary.card';
import { LevierCard } from './to-levier-cards';

const LevierCardList = ({ cards }: { cards: LevierCard[] }): JSX.Element => (
  <ul
    role="list"
    className="m-0 grid list-none gap-4 p-0 md:grid-cols-2 2xl:grid-cols-3"
  >
    {cards.map((card) => (
      <li key={card.levierId} className="p-0">
        <LevierSummaryCard levier={card} />
      </li>
    ))}
  </ul>
);

const LevierCardsLoading = (): JSX.Element => (
  <div role="status" className="flex h-96 items-center justify-center">
    <SpinnerLoader className="h-8 w-8" />
    <span className="sr-only">{appLabels.chargementEnCours}</span>
  </div>
);

const LevierCardsContent = ({
  levierCards,
}: {
  levierCards: LevierCardsQuery;
}): JSX.Element =>
  match(levierCards)
    .with({ status: 'loading' }, () => <LevierCardsLoading />)
    .with({ status: 'error' }, ({ retry }) => (
      <ErrorCard title={appLabels.uneErreurEstSurvenue} retry={retry} />
    ))
    .with({ status: 'ready' }, ({ cards, hasMobilisation }) => (
      <div className="flex flex-col gap-6">
        <VisibleWhen condition={!hasMobilisation}>
          <Alert title={appLabels.mobilisationAbsente} />
        </VisibleWhen>
        <LevierCardList cards={cards} />
      </div>
    ))
    .exhaustive();

export const PriorisationLeviersView = (): JSX.Element => {
  const { collectiviteId } = useCurrentCollectivite();
  const levierCards = useLevierCards(collectiviteId);

  return (
    <>
      <PageHeader>
        <PageHeader.Title>
          {appLabels.priorisationLeviersTitre}
        </PageHeader.Title>
      </PageHeader>
      <LevierCardsContent levierCards={levierCards} />
    </>
  );
};
