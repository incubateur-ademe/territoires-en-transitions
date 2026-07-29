import {
  makeCollectivitePlanActionUrl,
  makeCollectiviteToutesLesFichesUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { useGetAxe } from '@/app/plans/plans/show-plan/data/use-get-axe';
import { generateTitle } from '@/app/utils/generate-title';
import { AxeLight } from '@tet/domain/plans';
import { Breadcrumbs as BreadcrumbsUI } from '@tet/ui';
import { useRouter } from 'next/navigation';

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
}: BreadcrumbsProps): BreadcrumbsLink[] => {
  const { data } = useGetAxe(axeId);

  if (!axeId) {
    return [
      {
        label: appLabels.actionSansPlan,
        href: makeCollectiviteToutesLesFichesUrl({
          collectiviteId,
          searchParams: 'np=true',
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
      enableLastElementClick={Boolean(
        breadcrumbsLinks.length === 1 && breadcrumbsLinks[0].href
      )}
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
