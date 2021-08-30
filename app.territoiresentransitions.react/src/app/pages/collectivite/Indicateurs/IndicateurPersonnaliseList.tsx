import {IndicateurPersonnaliseStorable} from 'storables/IndicateurPersonnaliseStorable';
import {IndicateurPersonnaliseCard} from 'app/pages/collectivite/Indicateurs/IndicateurPersonnaliseCard';
import {IndicateurPersonnaliseCreatorExpandable} from './IndicateurPersonnaliseCreatorExpandable';
import {useAllStorables} from 'core-logic/hooks';
import {indicateurPersonnaliseStore} from 'core-logic/api/hybridStores';

export const IndicateurPersonnaliseList = () => {
  const indicateurs = useAllStorables<IndicateurPersonnaliseStorable>(
    indicateurPersonnaliseStore
  );
  indicateurs.sort((a, b) => a.nom.localeCompare(b.nom));

  return (
    <div className="app mx-5 mt-5">
      <IndicateurPersonnaliseCreatorExpandable buttonClasses="float-right" />
      <div className="flex flex-col justify-between">
        <h2 className="fr-h2">Mes indicateurs</h2>
        <section className="flex flex-col">
          {indicateurs.map(indicateur => (
            <IndicateurPersonnaliseCard
              indicateur={indicateur}
              key={indicateur.id}
            />
          ))}
        </section>
      </div>
    </div>
  );
};
