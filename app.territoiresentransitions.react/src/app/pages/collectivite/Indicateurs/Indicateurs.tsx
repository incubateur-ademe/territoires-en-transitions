import {useState} from 'react';
import {useParams} from 'react-router-dom';
import {SwitchLabelLeft} from 'ui/shared/SwitchLabelLeft';
import {referentielToName} from 'app/labels';
import {indicateurViewParam, IndicateurViewParamOption} from 'app/paths';
import {IndicateursNav} from './IndicateursNav';
import {IndicateurPersonnaliseList} from './IndicateurPersonnaliseList';
import {ConditionnalIndicateurReferentielList} from './ConditionnalIndicateurReferentielList';
import {UiSearchBar} from 'ui/UiSearchBar';

const viewTitles: Record<IndicateurViewParamOption, string> = {
  perso: 'Indicateurs personnalisés',
  cae: referentielToName.cae,
  eci: referentielToName.eci,
  crte: referentielToName.crte,
};

/**
 * Display the list of indicateurs for a given view
 */
const ConditionnalIndicateurList = (props: {
  view: IndicateurViewParamOption;
  showOnlyIndicateurWithData: boolean;
  pattern: string;
}) => {
  const {view, showOnlyIndicateurWithData, pattern} = props;
  if (view === 'perso')
    return (
      <IndicateurPersonnaliseList
        showOnlyIndicateurWithData={showOnlyIndicateurWithData}
        pattern={pattern}
      />
    );
  return (
    <ConditionnalIndicateurReferentielList
      referentiel={view}
      showOnlyIndicateurWithData={showOnlyIndicateurWithData}
      pattern={pattern}
    />
  );
};

/**
 * IndicateursList show both indicateurs personnalisés and indicateurs référentiel.
 */
const Indicateurs = () => {
  const {vue} = useParams<{
    [indicateurViewParam]?: IndicateurViewParamOption;
  }>();
  const current = vue || 'perso';

  const [showOnlyIndicateurWithData, setShowOnlyIndicateurWithData] =
    useState(false);
  const [pattern, setPattern] = useState('');

  return (
    <div className="fr-container !px-0 flex">
      <IndicateursNav />
      <div className="w-full">
        <div className="flex items-center mx-auto py-6 px-10 bg-indigo-700">
          <p className="flex grow py-2 px-3 m-0 font-bold text-white text-[2rem] leading-snug">
            {viewTitles[current]}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <SwitchLabelLeft
            id="only-filled"
            checked={showOnlyIndicateurWithData}
            className="!border-0 w-[28rem] mt-6"
            onChange={() => {
              setShowOnlyIndicateurWithData(!showOnlyIndicateurWithData);
            }}
          >
            Afficher uniquement les indicateurs renseignés
          </SwitchLabelLeft>
          <div className="w-80 fr-mr-1v">
            <UiSearchBar value={pattern} search={value => setPattern(value)} />
          </div>
        </div>
        <ConditionnalIndicateurList
          view={current}
          showOnlyIndicateurWithData={showOnlyIndicateurWithData}
          pattern={pattern}
        />
      </div>
    </div>
  );
};

export default Indicateurs;
