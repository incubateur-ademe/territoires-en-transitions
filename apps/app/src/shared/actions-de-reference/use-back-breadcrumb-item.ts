'use client';

import { actionDeReferenceFromParam } from '@/app/app/paths';
import { useCollectiviteId } from '@tet/api/collectivites';
import { parseAsString, useQueryState } from 'nuqs';
import {
  type BackBreadcrumbItem,
  toBackBreadcrumbItem,
} from './to-back-breadcrumb-item';

export const useBackBreadcrumbItem = (): BackBreadcrumbItem => {
  const collectiviteId = useCollectiviteId();
  const [from] = useQueryState(actionDeReferenceFromParam, parseAsString);

  return toBackBreadcrumbItem({ from, collectiviteId });
};
