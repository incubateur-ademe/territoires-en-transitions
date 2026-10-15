import { appLabels } from '@/app/labels/catalog';
import PictoDashboard from '@/app/ui/pictogrammes/PictoDashboard';
import { CardCoverBanner } from '@/app/ui/shared/card-cover.banner';
import { LoadingStatus } from '@/app/ui/shared/loading-status';
import { ErrorCard } from '@/app/utils/error/error.card';
import type { ActionDeReference } from '@tet/domain/shared';
import { Badge, Card, EmptyCard } from '@tet/ui';
import type { JSX } from 'react';
import { match } from 'ts-pattern';
import { ActionDeReferenceInfos } from './action-de-reference.infos';
import { ActionDeReferenceUsefulnessCard } from './action-de-reference.usefulness.card';
import type { ActionDeReferenceDetail } from './data/use-get-action-de-reference';
import { LinkedFichesCard } from './linked-fiches.card';
import { useSendUsefulnessResponse } from './use-send-usefulness-response';

const ActionDeReferenceDescription = ({
  action,
}: {
  readonly action: ActionDeReference;
}): JSX.Element => (
  <Card className="gap-6 p-8 font-normal shadow-none">
    <section className="flex flex-col gap-1">
      <h2 className="m-0 text-base font-bold text-primary-9">
        {appLabels.actionDeReferenceDescriptionLabel}
      </h2>
      <p className="m-0 max-w-[70ch] whitespace-pre-line text-sm text-primary-9">
        {action.description}
      </p>
    </section>
    <ActionDeReferenceInfos action={action} />
  </Card>
);

const ActionDeReferenceDetails = ({
  action,
}: {
  readonly action: ActionDeReference;
}): JSX.Element => {
  const sendUsefulnessResponse = useSendUsefulnessResponse(action.id);

  return (
    <div className="flex flex-col gap-6">
      <Badge
        title={appLabels.actionDeReferenceAdeme}
        variant="warning"
        size="sm"
        className="w-fit"
      />
      <div className="flex w-full flex-col gap-6 md:flex-row">
        <div className="w-full md:flex-[2]">
          <CardCoverBanner />
          <div className="flex flex-col gap-6">
            <ActionDeReferenceDescription action={action} />
            <ActionDeReferenceUsefulnessCard
              onAnswer={sendUsefulnessResponse}
            />
          </div>
        </div>
        <div className="w-full md:flex-[1]">
          <LinkedFichesCard actionDeReferenceId={action.id} />
        </div>
      </div>
    </div>
  );
};

export const ActionDeReferenceContent = ({
  detail,
}: {
  readonly detail: ActionDeReferenceDetail;
}): JSX.Element =>
  match(detail)
    .with({ status: 'loading' }, () => <LoadingStatus />)
    .with({ status: 'error' }, ({ retry }) => (
      <ErrorCard
        title={appLabels.uneErreurEstSurvenue}
        retry={retry}
        retryLabel={appLabels.reessayer}
      />
    ))
    .with({ status: 'not-found' }, () => (
      <EmptyCard
        picto={(props) => <PictoDashboard {...props} />}
        title={appLabels.actionDeReferenceIntrouvable}
      />
    ))
    .with({ status: 'loaded' }, ({ action }) => (
      <ActionDeReferenceDetails action={action} />
    ))
    .exhaustive();
