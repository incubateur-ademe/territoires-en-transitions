'use client';

import { PreselectionToggleButton } from '@/app/collectivites/priorisation-leviers/preselection-toggle.button';
import { appLabels } from '@/app/labels/catalog';
import type { ActionDeReferenceId } from '@tet/domain/shared';
import { Breadcrumbs, PageHeader } from '@tet/ui';
import type { JSX } from 'react';
import { match } from 'ts-pattern';
import { ActionDeReferenceTypeBadge } from './action-de-reference-type.badge';
import { ActionDeReferenceContent } from './action-de-reference.content';
import {
  type ActionDeReferenceDetail,
  useGetActionDeReference,
} from './data/use-get-action-de-reference';
import { useBackBreadcrumbItem } from './use-back-breadcrumb-item';

const toPageTitle = (detail: ActionDeReferenceDetail): string =>
  match(detail)
    .with({ status: 'loaded' }, ({ action }) => action.titre)
    .otherwise(() => appLabels.actionDeReferenceTitre);

const toHeaderActions = (detail: ActionDeReferenceDetail): JSX.Element | null =>
  match(detail)
    .with({ status: 'loaded' }, ({ action }) => (
      <PageHeader.Actions>
        <PreselectionToggleButton action={action} />
      </PageHeader.Actions>
    ))
    .otherwise(() => null);

export const ActionDeReferenceView = ({
  actionDeReferenceId,
}: {
  readonly actionDeReferenceId: ActionDeReferenceId;
}): JSX.Element => {
  const backBreadcrumbItem = useBackBreadcrumbItem();
  const detail = useGetActionDeReference(actionDeReferenceId);
  const pageTitle = toPageTitle(detail);
  const isLoaded = detail.status === 'loaded';

  return (
    <>
      <PageHeader>
        <PageHeader.Title>{pageTitle}</PageHeader.Title>
        {toHeaderActions(detail)}
        <PageHeader.Subtitle>
          <Breadcrumbs
            size="sm"
            items={[backBreadcrumbItem, { label: pageTitle }]}
          />
        </PageHeader.Subtitle>
        <PageHeader.Metadata visibleWhen={isLoaded}>
          <PageHeader.MetadataRow>
            <ActionDeReferenceTypeBadge />
          </PageHeader.MetadataRow>
        </PageHeader.Metadata>
      </PageHeader>
      <ActionDeReferenceContent detail={detail} />
    </>
  );
};
