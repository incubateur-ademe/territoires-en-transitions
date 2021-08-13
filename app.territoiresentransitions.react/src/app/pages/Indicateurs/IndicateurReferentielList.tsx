import React from "react";
import { indicateurs } from "generated/data/indicateurs_referentiels";
import { IndicateurReferentielCard } from "./IndicateurReferentielCard";
import { IndicateurReferentiel } from "generated/models/indicateur_referentiel";

/**
 * Display the list of indicateur referentiel.
 *
 * Loads the list in two times to postpone rendering time.
 * todo: load the delayed list on scroll instead of using a timeout.
 */
export const IndicateurReferentielList = () => {
  const [delayedList, setDelayedList] = React.useState<IndicateurReferentiel[]>(
    [],
  );
  const initialList = indicateurs.slice(0, 10);

  const loadMore = () => {
    setDelayedList(indicateurs.slice(10));
  };

  return (
    <div className="app mx-5 mt-5">
      <section className="flex flex-col">
        {initialList.map((indicateur) => (
          <IndicateurReferentielCard
            indicateur={indicateur}
            key={indicateur.id}
          />
        ))}

        {delayedList.length === 0 && (
          <button className="fr-btn" onClick={loadMore}>
            Plus
          </button>
        )}

        {delayedList.map((indicateur) => (
          <IndicateurReferentielCard
            indicateur={indicateur}
            key={indicateur.id}
          />
        ))}
      </section>
    </div>
  );
};
