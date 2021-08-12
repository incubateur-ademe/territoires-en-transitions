import React, {useEffect} from "react";
import {IndicateurReferentiel} from "generated/models/indicateur_referentiel";
import {IndicateurValueStorable} from "storables/IndicateurValueStorable";
import {useAppState} from "core-logic/overmind";
import years from "./years";
import {commands} from "core-logic/commands/commands";


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


function IndicateurReferentielValueInput(props: { year: number, indicateur: IndicateurReferentiel }) {
    const [value, setValue] = React.useState<string>('');
    const epci_id = useAppState().epciId;

    useEffect(() => {
        commands.indicateurCommands.getIndicateurReferentielValue(id)
            .then((storable) => {
                console.log('got storable', storable?.id)
                setValue(storable?.value ?? '');
            })
    }, [value, epci_id])

    if (!epci_id) {
        return (<div>EPCI ? </div>)
    }

    const id = IndicateurValueStorable.buildId(epci_id, props.indicateur.id, props.year);


    const handleChange = (event: React.FormEvent<HTMLInputElement>) => {
        const inputValue = event.currentTarget.value;

        commands.indicateurCommands.storeIndicateurReferentielValue(
            new IndicateurValueStorable(
                {
                    epci_id: epci_id,
                    indicateur_id: props.indicateur.id,
                    year: props.year,
                    value: inputValue
                }
            )
        ).then((storable) => setValue(storable.value));
    };
    return (
        <label>
            {props.year}
            <input className="fr-input" defaultValue={value} onBlur={handleChange}/>
        </label>
    );
}

const IndicateurReferentielValues = (props: { indicateur: IndicateurReferentiel }) => (
    <ul className="bg-grey">
        {years.map((year) =>
            <IndicateurReferentielValueInput
                year={year}
                indicateur={props.indicateur}
                key={`${props.indicateur.id}-${year}`}/>)}
    </ul>
);


export const IndicateurReferentielCard = (props: { indicateur: IndicateurReferentiel }) => {
    // todo lookup related actions

    return (
        <div className="flex flex-col items-center pt-8 pr-6 pb-6">
            <h3 className="fr-h3 mb-6">{props.indicateur.nom}</h3>
            <IndicateurReferentielValues indicateur={props.indicateur}/>
            <DescriptionPanel description={props.indicateur.description}/>
        </div>
    );
};
