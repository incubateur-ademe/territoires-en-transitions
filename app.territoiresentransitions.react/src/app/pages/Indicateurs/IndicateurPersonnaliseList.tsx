import React, {useEffect} from 'react';
import {IndicateurPersonnaliseStorable} from 'storables/IndicateurPersonnaliseStorable';
import {commands} from 'core-logic/commands/commands';
import {IndicateurPersonnaliseCard} from './IndicateurPersonnaliseCard';

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
      <section className="flex flex-col">
        {list.map(indicateur => (
          <IndicateurPersonnaliseCard
            indicateur={indicateur}
            key={indicateur.id}
          />
        ))}
      </section>
    </div>
  );
};
