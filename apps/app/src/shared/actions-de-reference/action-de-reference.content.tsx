import { appLabels } from '@/app/labels/catalog';
import { DetailedAction } from '@/app/ui/detailed-action/detailed-action.layout';
import PictoDashboard from '@/app/ui/pictogrammes/PictoDashboard';
import { LoadingStatus } from '@/app/ui/shared/loading-status';
import { ErrorCard } from '@/app/utils/error/error.card';
import type { ActionDeReference } from '@tet/domain/shared';
import { EmptyCard } from '@tet/ui';
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
  <DetailedAction.Section>
    <div className="flex flex-col gap-4">
      <div className="flex flex-col">
        <DetailedAction.FieldTitle>
          {appLabels.actionDeReferenceDescriptionLabel}
        </DetailedAction.FieldTitle>
        <p className="m-0 whitespace-pre-line text-sm text-primary-9">
          {action.description}
        </p>
      </div>
      <ActionDeReferenceInfos action={action} />
    </div>
  </DetailedAction.Section>
);

const ActionDeReferenceDetails = ({
  action,
}: {
  readonly action: ActionDeReference;
}): JSX.Element => {
  const sendUsefulnessResponse = useSendUsefulnessResponse(action.id);

  return (
    <DetailedAction.Root>
      <DetailedAction.Main>
        <ActionDeReferenceDescription action={action} />
        <ActionDeReferenceUsefulnessCard onAnswer={sendUsefulnessResponse} />
      </DetailedAction.Main>
      <DetailedAction.Aside>
        <LinkedFichesCard actionDeReferenceId={action.id} />
      </DetailedAction.Aside>
    </DetailedAction.Root>
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
