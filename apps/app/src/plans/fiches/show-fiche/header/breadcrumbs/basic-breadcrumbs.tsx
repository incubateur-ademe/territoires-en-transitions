import {
  makeCollectivitePlanActionUrl,
  makeCollectiviteToutesLesFichesUrl,
} from '@/app/app/paths';
import { useGetAxe } from '@/app/plans/plans/show-plan/data/use-get-axe';
import { AxeLight } from '@tet/domain/plans';
import { Breadcrumbs as BreadcrumbsUI } from '@tet/ui';
import { useRouter } from 'next/navigation';
import { generateTitle } from '@/app/utils/generate-title';

type BreadcrumbsLink = {
  label: string;
  href?: string;
};

type BreadcrumbsArgs = {
  collectiviteId: number;
  fichePath: AxeLight[];
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
          openAxes: fichePath
            .filter((_, index) => index <= i)
            .map((axe) => axe.id),
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
}: BreadcrumbsProps): BreadcrumbsLink[] => {
  const { data } = useGetAxe(axeId);

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
