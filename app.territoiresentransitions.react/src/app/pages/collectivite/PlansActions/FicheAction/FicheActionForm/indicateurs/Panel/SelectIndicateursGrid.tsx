import {useIntersectionObserver} from 'utils/useIntersectionObserver';
import {
  Indicateur,
  TIndicateurListItem,
} from 'app/pages/collectivite/Indicateurs/types';
import IndicateurCard, {
  IndicateurCardProps,
} from 'app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import SpinnerLoader from 'ui/shared/SpinnerLoader';

type Props = {
  definitions?: TIndicateurListItem[];
  isLoading?: boolean;
  selectedIndicateurs: Indicateur[] | null;
  onSelect: (indicateurs: Indicateur[]) => void;
};

/** Affiche une grille de graphiques d'indicateur */
const SelectIndicateursGrid = (props: Props) => {
  const {definitions, isLoading, selectedIndicateurs, onSelect} = props;

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
            {definitions.map(definition => (
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
          <br /> ne correspond à votre recherche
        </div>
      )}
    </>
  );
};

/** Affiche le graphique uniquement lorsque son conteneur devient visible */
const IndicateurChartContainer = (
  props: IndicateurCardProps & {
    selectedIndicateurs: Indicateur[] | null;
    onSelect: (indicateurs: Indicateur[]) => void;
  }
) => {
  const {ref, entry} = useIntersectionObserver();
  const {definition, selectedIndicateurs, onSelect} = props;

  const selected =
    selectedIndicateurs?.some(
      i =>
        i.indicateur_id === definition.id ||
        i.indicateur_personnalise_id === definition.id
    ) ?? false;

  const setSelected = (indicateur: Indicateur) => {
    if (selected) {
      onSelect(
        selectedIndicateurs?.filter(
          i =>
            i.indicateur_id !== indicateur.indicateur_id ||
            i.indicateur_personnalise_id !==
              indicateur.indicateur_personnalise_id
        ) ?? []
      );
    } else {
      onSelect([...(selectedIndicateurs ?? []), indicateur]);
    }
  };

  return (
    <div ref={ref} className="min-h-[20rem]">
      {entry?.isIntersecting ? (
        <IndicateurCard
          definition={definition}
          selectState={{
            checkbox: true,
            selected,
            setSelected,
          }}
        />
      ) : (
        definition.nom
      )}
    </div>
  );
};

export default SelectIndicateursGrid;
