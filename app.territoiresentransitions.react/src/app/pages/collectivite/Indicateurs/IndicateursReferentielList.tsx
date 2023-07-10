import MultiTagFilters from 'ui/shared/filters/MultiTagFilters';
import IndicateurChartsGrid from './IndicateurChartsGrid';
import {useIndicateursParentsGroup} from './useIndicateurDefinitions';
import {ReferentielOfIndicateur} from 'types/litterals';
import {referentielToName} from 'app/labels';
import {useFilteredDefinitions} from './useFilteredDefinitions';
import {FilterSummary} from './FilterSummary';

const REFERENTIEL_TO_NAME = {...referentielToName, crte: 'CRTE'};

/**
 * Affiche les indicateurs associés à un référentiel
 */
export const IndicateursReferentielList = (props: {
  referentiel: ReferentielOfIndicateur;
}) => {
  const {referentiel} = props;

  // charge et filtre les définitions
  const {
    definitions,
    options,
    optionsWithoutResults,
    selection,
    updateSelection,
    resetSelection,
  } = useFilteredDefinitions({
    definitions: useIndicateursParentsGroup(referentiel),
    defaultOptionLabel: `Tous les indicateurs ${REFERENTIEL_TO_NAME[referentiel]}`,
    addThematiqueOptions: true,
    // addTypeOptions: true,  // TODO: décommenter pour activer les filtres par type (impact/résultat)
    addParticipationScoreWithLabel:
      referentiel === 'cae'
        ? `Participe au score ${referentielToName.cae}`
        : undefined,
  });

  return (
    <>
      <MultiTagFilters
        className="fr-mb-4w"
        options={options}
        disabledOptions={optionsWithoutResults}
        values={selection}
        onChange={updateSelection}
      />
      <FilterSummary
        count={definitions.length}
        resetSelection={resetSelection}
        selection={selection}
      />
      <IndicateurChartsGrid definitions={definitions} />
    </>
  );
};
