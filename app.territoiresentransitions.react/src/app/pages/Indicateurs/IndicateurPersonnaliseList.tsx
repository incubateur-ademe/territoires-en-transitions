import React, {useEffect} from "react";
import {IndicateurPersonnaliseStorable} from "storables/IndicateurPersonnaliseStorable";
import {commands} from "core-logic/commands/commands";
import {IndicateurPersonnaliseCard} from "./IndicateurPersonnaliseCard";


export const IndicateurPersonnaliseList = () => {
    const [list, setList] = React.useState<IndicateurPersonnaliseStorable[]>([]);

    useEffect(() => {
        commands.indicateurCommands
            .getAllIndicateursPersonnalises()
            .then((results) => {
                console.log('results', results);
                setList(results);
            });
    }, [list.length])

    return (
        <div className="app mx-5 mt-5">
            <section className="flex flex-col">
                <ul>
                    {list.map((indicateur) => (
                        <li key={indicateur.id}>
                            <IndicateurPersonnaliseCard indicateur={indicateur}/>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
};
