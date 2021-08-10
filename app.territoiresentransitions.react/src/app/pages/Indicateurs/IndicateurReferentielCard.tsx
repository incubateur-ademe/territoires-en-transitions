import {IndicateurReferentiel} from "generated/models/indicateur_referentiel";


const ExpandPanel = (props: { content: string, title: string }) => (
    <details>
        <summary>
            {props.title}
        </summary>
        <div>
            {props.content}
        </div>
    </details>
);

const DescriptionPanel = (props: { description: string }) => (
    <ExpandPanel title={'description'} content={props.description}/>
);

const years: number[] = Array.from({length: (2022 - 2010)}, (v, k) => k + 2010);

const IndicateurReferentielValueInput = (props: { years: number, indicateur: IndicateurReferentiel }) => (
    <input className="fr-input"/>
);

const IndicateurReferentielValues = (props: { indicateur: IndicateurReferentiel }) => (
    <ul className="bg-grey">
        {years.map((year) =>
            <IndicateurReferentielValueInput
                years={year}
                indicateur={props.indicateur}
                key={`${props.indicateur.id}-${year}`}/>)}
    </ul>
);

export const IndicateurReferentielCard = (props: { indicateur: IndicateurReferentiel }) => (
    <div className="flex flex-col items-center pt-8 pr-6 pb-6">
        <h3 className="fr-h3 mb-6">{props.indicateur.nom}</h3>
        <DescriptionPanel description={props.indicateur.description}/>
        <IndicateurReferentielValues indicateur={props.indicateur}/>
    </div>
);
