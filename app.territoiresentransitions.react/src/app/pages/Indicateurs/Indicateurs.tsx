import {Route} from "type-route";
import {routes} from "app/Router";

import "app/DesignSystem/core.css";
import {indicateurs} from "generated/data/indicateurs_referentiels";
import {IndicateurReferentielCard} from "./IndicateurReferentielCard";


type IndicateursProps = {
    route: Route<typeof routes.indicateurs>;
};

export const Indicateurs = (props: IndicateursProps) => (

    <div className="app mx-5 mt-5">
        <h1>Indicateurs</h1>
        <section className="flex flex-col">
            {indicateurs.map((indicateur) => (
                <IndicateurReferentielCard indicateur={indicateur}/>
            ))}
        </section>
    </div>
);
