import { appLabels } from '@/app/labels/catalog';
import type { ActionDeReference } from '@tet/domain/shared';
import { Badge, Card } from '@tet/ui';
import { JSX, ReactNode } from 'react';

type ActionDeReferenceSummaryCardProps = {
  action: Pick<ActionDeReference, 'titre' | 'description'>;
  children: ReactNode;
};

const ActionDeReferenceSummaryTitle = ({
  children,
}: {
  children: ReactNode;
}): JSX.Element => <h4 className="mb-0 text-sm text-primary-9">{children}</h4>;

export const ActionDeReferenceSummaryCard = ({
  action,
  children,
}: ActionDeReferenceSummaryCardProps): JSX.Element => (
  <Card className="h-full gap-3 font-normal">
    <Badge
      title={appLabels.actionDeReferenceAdeme}
      variant="warning"
      size="sm"
      className="w-fit"
    />
    <ActionDeReferenceSummaryTitle>
      {action.titre}
    </ActionDeReferenceSummaryTitle>
    <p className="mb-0 whitespace-pre-line text-xs text-grey-8">
      {action.description}
    </p>
    <div className="mt-auto flex flex-wrap items-center gap-3">{children}</div>
  </Card>
);
