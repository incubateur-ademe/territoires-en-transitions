import {
  makeCollectiviteActionsDeReferenceUrl,
  makeCollectivitePreselectionUrl,
  makeCollectivitePriorisationUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';

export type BackBreadcrumbItem = {
  readonly label: string;
  readonly href: string;
};

const toKnownOrigins = (
  collectiviteId: number
): readonly BackBreadcrumbItem[] => [
  {
    label: appLabels.actionsDeReference,
    href: makeCollectiviteActionsDeReferenceUrl({ collectiviteId }),
  },
  {
    label: appLabels.priorisationLeviersTitre,
    href: makeCollectivitePriorisationUrl({ collectiviteId }),
  },
  {
    label: appLabels.actionsSauvegardeesTitre,
    href: makeCollectivitePreselectionUrl({ collectiviteId }),
  },
];

const isRelativePath = (from: string): boolean =>
  from.startsWith('/') && !from.startsWith('//');

const toPathname = (from: string): string => from.split('?')[0];

const toFollowedOrigin = ({
  from,
  knownOrigins,
}: {
  readonly from: string | null;
  readonly knownOrigins: readonly BackBreadcrumbItem[];
}): BackBreadcrumbItem | undefined => {
  if (from === null || !isRelativePath(from)) {
    return undefined;
  }

  const origin = knownOrigins.find(({ href }) => href === toPathname(from));
  if (origin === undefined) {
    return undefined;
  }

  return { label: origin.label, href: from };
};

export const toBackBreadcrumbItem = ({
  from,
  collectiviteId,
}: {
  readonly from: string | null;
  readonly collectiviteId: number;
}): BackBreadcrumbItem => {
  const knownOrigins = toKnownOrigins(collectiviteId);
  const [actionsDeReference] = knownOrigins;
  return toFollowedOrigin({ from, knownOrigins }) ?? actionsDeReference;
};
