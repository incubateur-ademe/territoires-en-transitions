import "app/DesignSystem/core.css";
import {indicateurs} from "generated/data/indicateurs_referentiels";
import {IndicateurReferentielCard} from "./IndicateurReferentielCard";
import {useParams, useRouteMatch} from "react-router-dom";
import {overmind} from "../../../core-logic/overmind";


export const Indicateurs = () => {
    const {path, url} = useRouteMatch();
    const {epciId} = useParams<{ epciId: string }>();
    overmind.actions.setCurrentEpci(epciId)

    console.log("path in indicateur is ", path, "url is", url, " and EPCI ID is", epciId)

    return (

        <div className="app mx-5 mt-5">
            <h1>Indicateurs</h1>
            <section className="flex flex-col">
                {indicateurs.map((indicateur) => (
                    <IndicateurReferentielCard indicateur={indicateur}/>
                ))}
            </section>
        </div>
    );
};
