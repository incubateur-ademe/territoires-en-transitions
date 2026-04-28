import {
  makeCollectivitePlanActionUrl,
  makeCollectiviteToutesLesFichesUrl,
} from '@/app/app/paths';
import { TAxeRow } from '@/app/types/alias';
import { generateTitle } from '@/app/utils/generate-title';
import { Breadcrumbs as BreadcrumbsUI } from '@tet/ui';
import { useRouter } from 'next/navigation';
import { usePlanActionChemin } from '../../data/usePlanActionChemin';

type BreadcrumbsLink = {
  label: string;
  href?: string;
};

type BreadcrumbsArgs = {
  collectiviteId: number;
  fichePath: TAxeRow[];
  title: string;
  planId?: number;
};

const toBreadcrumbsLinks = ({
  collectiviteId,
  fichePath,
  title,
  planId,
}: BreadcrumbsArgs): BreadcrumbsLink[] => {
  return [
    ...fichePath.map((axe, i) => {
      return {
        label: generateTitle(axe.nom),
        href: makeCollectivitePlanActionUrl({
          collectiviteId,
          planActionUid: planId?.toString() ?? '',
          openAxes:
            i === 0 ? [] : fichePath.slice(1, i + 1).map((axe) => axe.id),
        }),
      };
    }),
    { label: generateTitle(title) },
  ];
};

const useGetBreadcrumbsLinks = ({
  title,
  collectiviteId,
  axeId,
  planId,
}: BreadcrumbsProps) => {
  const { data } = usePlanActionChemin(axeId);

  if (!axeId) {
    return [
      {
        label: 'Action non classée',
        href: makeCollectiviteToutesLesFichesUrl({
          collectiviteId,
          ficheViewType: 'hors-plan',
        }),
      },
    ];
  }

  return toBreadcrumbsLinks({
    collectiviteId,
    fichePath: data?.chemin ?? [],
    planId,
    title,
  });
};

type BreadcrumbsProps = {
  title: string;
  collectiviteId: number;
  axeId?: number;
  planId?: number;
};

export const Breadcrumbs = (props: BreadcrumbsProps) => {
  const router = useRouter();
  const breadcrumbsLinks = useGetBreadcrumbsLinks(props);

  return (
    <BreadcrumbsUI
      size="sm"
      items={breadcrumbsLinks.map((item) => {
        const href = item.href;
        return {
          label: item.label,
          onClick: href ? () => router.push(href) : undefined,
        };
      })}
    />
  );
};
