import {indicateurs} from "generated/data/indicateurs_referentiels";
import {IndicateurReferentielCard} from "./IndicateurReferentielCard";
import {useParams, useRouteMatch} from "react-router-dom";
import {overmind} from "../../../core-logic/overmind";
import React from "react";


const IndicateurReferentielList = () => {
    const [list, setList] = React.useState(indicateurs.slice(0, 10))

    setTimeout(() => setList(indicateurs), 2000)

    return (

        <div className="app mx-5 mt-5">
            <section className="flex flex-col">
                {list.map((indicateur) => (
                    <IndicateurReferentielCard indicateur={indicateur}/>
                ))}
            </section>
        </div>
    );
};

export default IndicateurReferentielList;
