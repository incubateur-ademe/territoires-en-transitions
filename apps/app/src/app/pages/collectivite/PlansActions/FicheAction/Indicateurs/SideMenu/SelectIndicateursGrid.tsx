import IndicateurCard, {
  IndicateurCardProps,
} from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import { IndicateurDefinitionListItem } from '@/app/indicateurs/definitions/use-list-indicateur-definitions';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useIntersectionObserver } from '@/app/utils/useIntersectionObserver';

type Props = {
  definitions?: IndicateurDefinitionListItem[];
  isLoading?: boolean;
  selectedIndicateurs: IndicateurDefinitionListItem[] | null | undefined;
  onSelect: (indicateur: IndicateurDefinitionListItem) => void;
};

/** Affiche une grille de graphiques d'indicateur */
const SelectIndicateursGrid = (props: Props) => {
  const { definitions, isLoading, selectedIndicateurs, onSelect } = props;

  return (
    <>
      {/** Loading */}
      {isLoading ? (
        <SpinnerLoader className="mx-auto my-28" />
      ) : /** Indicateurs */
      definitions && definitions.length > 0 ? (
        <>
          {/** Nb results */}
          <div className="mb-4 text-sm text-grey-7">
            {definitions.length} résultat
            {definitions.length > 1 && 's'}
          </div>
          {/** Grid */}
          <div className="flex flex-col gap-6">
            {definitions.map((definition) => (
              <IndicateurChartContainer
                key={definition.id}
                definition={definition}
                selectedIndicateurs={selectedIndicateurs}
                onSelect={onSelect}
              />
            ))}
          </div>
        </>
      ) : (
        /** No data */
        <div className="my-24 text-center text-sm text-grey-6">
          Aucun indicateur
          <br />
          ne correspond à votre recherche
        </div>
      )}
    </>
  );
};

/** Affiche le graphique uniquement lorsque son conteneur devient visible */
const IndicateurChartContainer = (
  props: IndicateurCardProps & {
    selectedIndicateurs: IndicateurDefinitionListItem[] | null | undefined;
    onSelect: (indicateur: IndicateurDefinitionListItem) => void;
  }
) => {
  const { ref, entry } = useIntersectionObserver();
  const { definition, selectedIndicateurs, onSelect } = props;

  const selected =
    selectedIndicateurs?.some((i) => i.id === definition.id) ?? false;

  return (
    <div ref={ref} className="min-h-[5rem]">
      {entry?.isIntersecting ? (
        <IndicateurCard
          definition={definition}
          selectState={{
            checkbox: true,
            selected,
            setSelected: onSelect,
          }}
          hideChartWithoutValue
        />
      ) : (
        definition.titre
      )}
    </div>
  );
};

export default SelectIndicateursGrid;
