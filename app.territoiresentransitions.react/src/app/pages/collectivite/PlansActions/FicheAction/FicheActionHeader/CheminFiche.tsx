import { Breadcrumbs } from '@tet/ui';
import { useRouter } from 'next/navigation';
import { TAxeRow } from 'types/alias';
import {
  generateFilArianeLinks,
  usePlanActionChemin,
} from '../../PlanAction/data/usePlanActionChemin';

type CheminFicheProps = {
  titre: string;
  axeId: number;
  collectiviteId: number;
};

const CheminFiche = ({ titre, axeId, collectiviteId }: CheminFicheProps) => {
  const router = useRouter();
  const { data } = usePlanActionChemin(axeId);

  return (
    <Breadcrumbs
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

export default CheminFiche;
