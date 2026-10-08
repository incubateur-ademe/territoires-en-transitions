import { appLabels } from '@/app/labels/catalog';
import { ActionDeReferenceDetailLink } from '@/app/shared/actions-de-reference/action-de-reference-detail.link';
import type { ActionDeReference } from '@tet/domain/shared';
import { Badge, Card } from '@tet/ui';
import { JSX, ReactNode } from 'react';

type ActionDeReferenceSummaryCardProps = {
  action: Pick<ActionDeReference, 'id' | 'titre' | 'description'>;
  children: ReactNode;
};

const ActionDeReferenceSummaryTitle = ({
  action,
}: Pick<ActionDeReferenceSummaryCardProps, 'action'>): JSX.Element => (
  <h4 className="mb-0 text-sm leading-normal text-primary-9">
    <ActionDeReferenceDetailLink action={action} />
  </h4>
);

export const ActionDeReferenceSummaryCard = ({
  action,
  children,
}: ActionDeReferenceSummaryCardProps): JSX.Element => (
  <Card className="relative h-full gap-3 font-normal">
    <Badge
      title={appLabels.actionDeReferenceAdeme}
      variant="warning"
      size="sm"
      className="w-fit"
    />
    <ActionDeReferenceSummaryTitle action={action} />
    <p className="mb-0 whitespace-pre-line text-xs text-grey-8">
      {action.description}
    </p>
    <div className="relative mt-auto flex w-fit flex-wrap items-center gap-3">
      {children}
    </div>
  </Card>
);
