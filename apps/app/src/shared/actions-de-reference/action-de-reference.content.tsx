import { appLabels } from '@/app/labels/catalog';
import PictoDashboard from '@/app/ui/pictogrammes/PictoDashboard';
import { CardCoverBanner } from '@/app/ui/shared/card-cover.banner';
import { LoadingStatus } from '@/app/ui/shared/loading-status';
import { ErrorCard } from '@/app/utils/error/error.card';
import { type ActionDeReference, LEVIER_NOM_BY_ID } from '@tet/domain/shared';
import { Badge, Card, EmptyCard } from '@tet/ui';
import type { JSX, ReactNode } from 'react';
import { match } from 'ts-pattern';
import { ActionDeReferenceBadges } from './action-de-reference.badges';
import type { ActionDeReferenceDetail } from './data/use-get-action-de-reference';
import { MisesEnOeuvreCard } from './mises-en-oeuvre.card';

const ActionDeReferenceField = ({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}): JSX.Element => (
  <div className="flex flex-col gap-1">
    <dt className="text-sm font-bold text-primary-9">{label}</dt>
    <dd className="m-0 whitespace-pre-line text-grey-8">{children}</dd>
  </div>
);

const ActionDeReferenceFields = ({
  action,
}: {
  readonly action: ActionDeReference;
}): JSX.Element => (
  <Card className="gap-6 p-6 font-normal shadow-none">
    <dl className="m-0 flex flex-col gap-6">
      <ActionDeReferenceField
        label={appLabels.actionDeReferenceDescriptionLabel}
      >
        {action.description}
      </ActionDeReferenceField>
      <ActionDeReferenceField label={appLabels.actionDeReferenceLevierLabel}>
        {LEVIER_NOM_BY_ID[action.levier]}
      </ActionDeReferenceField>
      <ActionDeReferenceField label={appLabels.actionDeReferenceCategorieLabel}>
        {appLabels.categorieActionLabel(action.categorie)}
      </ActionDeReferenceField>
    </dl>
  </Card>
);

const ActionDeReferenceDetails = ({
  action,
}: {
  readonly action: ActionDeReference;
}): JSX.Element => (
  <div className="flex flex-col gap-6">
    <div className="flex flex-wrap items-center gap-2">
      <Badge
        title={appLabels.actionDeReferenceAdeme}
        variant="warning"
        size="sm"
        className="w-fit"
      />
      <ActionDeReferenceBadges action={action} hasUpdateButton={false} />
    </div>
    <div className="flex w-full flex-col gap-6 md:flex-row">
      <div className="w-full md:flex-[2]">
        <CardCoverBanner />
        <ActionDeReferenceFields action={action} />
      </div>
      <div className="w-full md:flex-[1]">
        <MisesEnOeuvreCard actionDeReferenceId={action.id} />
      </div>
    </div>
  </div>
);

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
