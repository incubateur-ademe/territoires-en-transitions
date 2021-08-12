import {IndicateurPersonnaliseCard} from "./IndicateurPersonnaliseCard";
import {overmind} from "../../../core-logic/overmind";
import React from "react";
import {IndicateurPersonnaliseStorable} from "../../../storables/IndicateurPersonnaliseStorable";


const IndicateurPersonnaliseList = () => {
    const [list, setList] = React.useState<IndicateurPersonnaliseStorable[]>([]);
    overmind.actions.indicateurCommands.getAllIndicateursPersonnalises().then((results) => setList(results));

    return (
        <div className="app mx-5 mt-5">
            <section className="flex flex-col">
                {list.map((indicateur) => (
                    <IndicateurPersonnaliseCard indicateur={indicateur}/>
                ))}
            </section>
        </div>
    );
};

export default IndicateurPersonnaliseList;
