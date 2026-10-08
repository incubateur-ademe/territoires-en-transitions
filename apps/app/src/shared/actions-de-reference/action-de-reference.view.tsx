'use client';

import { makeCollectiviteActionsDeReferenceUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import type { ActionDeReferenceId } from '@tet/domain/shared';
import { Breadcrumbs, PageHeader } from '@tet/ui';
import type { JSX } from 'react';
import { match } from 'ts-pattern';
import { ActionDeReferenceContent } from './action-de-reference.content';
import {
  type ActionDeReferenceDetail,
  useGetActionDeReference,
} from './data/use-get-action-de-reference';

const toPageTitle = (detail: ActionDeReferenceDetail): string =>
  match(detail)
    .with({ status: 'loaded' }, ({ action }) => action.titre)
    .otherwise(() => appLabels.actionDeReferenceTitre);

export const ActionDeReferenceView = ({
  actionDeReferenceId,
}: {
  readonly actionDeReferenceId: ActionDeReferenceId;
}): JSX.Element => {
  const { collectiviteId } = useCurrentCollectivite();
  const detail = useGetActionDeReference(actionDeReferenceId);
  const pageTitle = toPageTitle(detail);

  return (
    <>
      <PageHeader>
        <PageHeader.Title>{pageTitle}</PageHeader.Title>
        <PageHeader.Subtitle>
          <Breadcrumbs
            size="sm"
            items={[
              {
                label: appLabels.actionsDeReference,
                href: makeCollectiviteActionsDeReferenceUrl({ collectiviteId }),
              },
              { label: pageTitle },
            ]}
          />
        </PageHeader.Subtitle>
      </PageHeader>
      <ActionDeReferenceContent detail={detail} />
    </>
  );
};
