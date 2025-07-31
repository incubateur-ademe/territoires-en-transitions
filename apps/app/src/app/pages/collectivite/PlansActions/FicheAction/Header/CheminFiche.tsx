import { TAxeRow } from '@/app/types/alias';
import { Breadcrumbs } from '@/ui';
import { useRouter } from 'next/navigation';
import {
  generateFilArianeLinks,
  usePlanActionChemin,
} from '../../PlanAction/data/usePlanActionChemin';

type CheminFicheProps = {
  titre: string;
  axeId: number;
  collectiviteId: number;
};

export const ClassifiedFicheBreadcrumbs = ({
  titre,
  axeId,
  collectiviteId,
}: CheminFicheProps) => {
  const router = useRouter();
  const { data } = usePlanActionChemin(axeId);
  return (
    <Breadcrumbs
      size="sm"
      items={generateFilArianeLinks({
        collectiviteId,
        chemin: (data?.chemin ?? []) as TAxeRow[],
        titreFiche: titre,
      }).map((item) => ({
        label: item.label,
        onClick: item.href ? () => router.push(item.href!) : undefined,
      }))}
    />
  );
};
