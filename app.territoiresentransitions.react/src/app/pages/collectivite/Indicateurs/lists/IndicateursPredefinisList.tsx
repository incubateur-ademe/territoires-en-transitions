import {useIndicateursParentsGroup} from '../useIndicateurDefinitions';
import {ReferentielOfIndicateur} from 'types/litterals';
import {referentielToName} from 'app/labels';
import {useFilteredDefinitions} from './useFilteredDefinitions';
import {FiltersAndGrid} from './FiltersAndGrid';

const REFERENTIEL_TO_NAME: typeof referentielToName = {
  ...referentielToName,
  crte: 'CRTE',
};

/**
 * Affiche les indicateurs prédéfinis (associés à un référentiel ou autre)
 */
export const IndicateursPredefinisList = (props: {
  referentiel: ReferentielOfIndicateur;
}) => {
  const {referentiel} = props;

  // charge et filtre les définitions
  const filteredDefinitions = useFilteredDefinitions({
    definitions: useIndicateursParentsGroup(referentiel),
    defaultOptionLabel: `Tous les indicateurs ${REFERENTIEL_TO_NAME[referentiel]}`,
    addThematiqueOptions: true,
    // addTypeOptions: true,  // TODO: décommenter pour activer les filtres par type (impact/résultat)
    addParticipationScoreWithLabel:
      referentiel === 'cae'
        ? `Participe au score ${referentielToName.cae}`
        : undefined,
  });

  return <FiltersAndGrid filteredDefinitions={filteredDefinitions} />;
};
