import {indicateurs} from 'generated/data/indicateurs_referentiels';
import {IndicateurReferentielCard} from './AnyIndicateurCard';
import {Referentiel} from 'types';

/**
 * Display the list of indicateurs for a given referentiel
 */
export const ConditionnalIndicateurReferentielList = (props: {
  referentiel: Referentiel;
}) => {
  const filtered = indicateurs.filter(indicateur =>
    indicateur.id.startsWith(props.referentiel)
  );
  return (
    <div className="app mx-5 mt-5">
      <section className="flex flex-col">
        {filtered.map(indicateur => {
          return (
            <IndicateurReferentielCard
              indicateur={indicateur}
              key={indicateur.uid}
            />
          );
        })}
      </section>
    </div>
  );
};
