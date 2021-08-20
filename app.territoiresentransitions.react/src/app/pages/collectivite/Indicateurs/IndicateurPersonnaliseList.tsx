import React, {useEffect} from 'react';
import {IndicateurPersonnaliseStorable} from 'storables/IndicateurPersonnaliseStorable';
import {commands} from 'core-logic/commands';
import {IndicateurPersonnaliseCard} from 'app/pages/collectivite/Indicateurs/IndicateurPersonnaliseCard';

export const IndicateurPersonnaliseList = () => {
  const [list, setList] = React.useState<IndicateurPersonnaliseStorable[]>([]);

  useEffect(() => {
    commands.indicateurCommands
      .getAllIndicateursPersonnalises()
      .then(results => {
        setList(results.sort((a, b) => a.nom.localeCompare(b.nom)));
      });
  }, [list.length]);

  return (
    <div className="app mx-5 mt-5">
      <div className="flex flex-row justify-between">
        <h2 className=" fr-h2">Mes indicateurs</h2>
        <button className=" bg-yellow-400">todo Ajouter un indicateur</button>
      </div>
      <section className=" flex flex-col">
        {list.map(indicateur => (
          <IndicateurPersonnaliseCard
            indicateur={indicateur}
            key={indicateur.id}
          />
        ))}
      </section>
      ;
    </div>
  );
};
