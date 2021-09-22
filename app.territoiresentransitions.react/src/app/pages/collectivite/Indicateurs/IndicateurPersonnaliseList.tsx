import {IndicateurPersonnaliseStorable} from 'storables/IndicateurPersonnaliseStorable';
import {IndicateurPersonnaliseCreationDialog} from './IndicateurPersonnaliseCreationDialog';
import {useAllStorables} from 'core-logic/hooks';
import {indicateurPersonnaliseStore} from 'core-logic/api/hybridStores';
import {IndicateurPersonnaliseCard} from 'app/pages/collectivite/Indicateurs/AnyIndicateurCard';

export const IndicateurPersonnaliseList = ({
  showOnlyIndicateurWithData = false,
}) => {
  const indicateurs = useAllStorables<IndicateurPersonnaliseStorable>(
    indicateurPersonnaliseStore
  );
  indicateurs.sort((a, b) => a.nom.localeCompare(b.nom));

  return (
    <div className="app mx-5 mt-5">
      <div className="float-right -mt-12">
        <IndicateurPersonnaliseCreationDialog />
      </div>
      {/* <div className="flex flex-col justify-between "> */}
      <section className="flex flex-col">
        {indicateurs.map(indicateur => (
          <IndicateurPersonnaliseCard
            indicateur={indicateur}
            key={indicateur.uid}
            hideIfNoValues={showOnlyIndicateurWithData}
          />
        ))}
      </section>
    </div>
    // </div>
  );
};
