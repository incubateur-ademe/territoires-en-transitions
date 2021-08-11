
import "app/DesignSystem/core.css";
import {indicateurs} from "generated/data/indicateurs_referentiels";
import {IndicateurReferentielCard} from "./IndicateurReferentielCard";



export const Indicateurs = () => {
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
