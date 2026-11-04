import IndicateurCard, {
  IndicateurCardProps,
} from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useIntersectionObserver } from '@/app/utils/useIntersectionObserver';

type Props = {
  indicateurs?: IndicateurDetaille[];
  isLoading?: boolean;
  selectedIndicateurs: IndicateurDetaille[] | null | undefined;
  onSelect: (indicateur: IndicateurDetaille) => void;
};

export const IndicateursSelectorGrid = (props: Props) => {
  const { indicateurs, isLoading, selectedIndicateurs, onSelect } = props;
  return (
    <>
      {/** Loading */}
      {isLoading ? (
        <SpinnerLoader className="mx-auto my-28" />
      ) : /** Indicateurs */
      indicateurs && indicateurs.length > 0 ? (
        <>
          {/** Nb results */}
          <div className="mb-4 text-sm text-grey-7">
            {appLabels.resultat({ count: indicateurs.length })}
          </div>
          {/** Grid */}
          <div className="flex flex-col gap-6">
            {indicateurs.map((indicateur) => (
              <IndicateurChartContainer
                key={indicateur.id}
                indicateur={indicateur}
                selectedIndicateurs={selectedIndicateurs}
                onSelect={onSelect}
              />
            ))}
          </div>
        </>
      ) : (
        /** No data */
        <div className="my-24 text-center text-sm text-grey-6">
          {appLabels.aucunIndicateur}
          <br />
          {appLabels.neCorrespondPasRecherche}
        </div>
      )}
    </>
  );
};

/** Affiche le graphique uniquement lorsque son conteneur devient visible */
const IndicateurChartContainer = (
  props: IndicateurCardProps & {
    selectedIndicateurs: IndicateurDetaille[] | null | undefined;
    onSelect: (indicateur: IndicateurDetaille) => void;
  }
) => {
  const { ref, entry } = useIntersectionObserver();
  const { indicateur, selectedIndicateurs, onSelect } = props;

  const selected =
    selectedIndicateurs?.some((i) => i.id === indicateur.id) ?? false;

  return (
    <div ref={ref} className="min-h-[5rem]">
      {entry?.isIntersecting ? (
        <IndicateurCard
          indicateur={indicateur}
          selectState={{
            checkbox: true,
            selected,
            setSelected: onSelect,
          }}
          hideChartWithoutValue
        />
      ) : (
        indicateur.titre
      )}
    </div>
  );
};
