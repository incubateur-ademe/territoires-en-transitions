import React, { useEffect } from "react";
import { IndicateurValueStorable } from "storables/IndicateurValueStorable";
import { useAppState } from "core-logic/overmind";
import { IndicateurPersonnaliseStorable } from "storables/IndicateurPersonnaliseStorable";
import { commands } from "core-logic/commands/commands";

const ExpandPanel = (props: { content: string; title: string }) => (
  <details>
    <summary>{props.title}</summary>
    <div>{props.content}</div>
  </details>
);

const DescriptionPanel = (props: { description: string }) => (
  <ExpandPanel title={"description"} content={props.description} />
);

const years: number[] = Array.from({ length: 2022 - 2010 }, (v, k) => k + 2010);

const IndicateurPersonnaliseValueInput = (props: {
  year: number;
  indicateur: IndicateurPersonnaliseStorable;
}) => {
  const [value, setValue] = React.useState("");
  const epci_id = useAppState().currentEpciId; // Même remarque que dans le commentaire
  useEffect(() => {
    commands.indicateurCommands
      .getIndicateurPersonnaliseValue(id)
      .then((storable) => setValue(storable?.value ?? ""));
  }, [value, epci_id]);

  if (!epci_id) {
    return <div>EPCI ? </div>;
  }

  const id = IndicateurValueStorable.buildId(
    epci_id,
    props.indicateur.id,
    props.year,
  );

  const handleChange = (event: React.FormEvent<HTMLInputElement>) => {
    const inputValue = event.currentTarget.value;

    commands.indicateurCommands
      .storeIndicateurPersonnaliseValue(
        new IndicateurValueStorable({
          epci_id: epci_id,
          indicateur_id: props.indicateur.id,
          year: props.year,
          value: inputValue,
        }),
      )
      .then((storable) => setValue(storable.value));
  };
  return (
    <label>
      {props.year}
      <input className="fr-input" defaultValue={value} onBlur={handleChange} />
    </label>
  );
};

const IndicateurPersonnaliseValues = (props: {
  indicateur: IndicateurPersonnaliseStorable;
}) => (
  <>
    {years.map((year) => (
      <IndicateurPersonnaliseValueInput
        year={year}
        indicateur={props.indicateur}
        key={`${props.indicateur.id}-${year}`}
      />
    ))}
  </>
);

const IndicateurPersonnaliseCommentaire = (props: {
  indicateur: IndicateurPersonnaliseStorable;
}) => {
  const [value, setValue] = React.useState(
    props.indicateur.meta["commentaire"] ?? "",
  );

  function handleSave(event: React.FormEvent<HTMLTextAreaElement>) {
    const inputValue = event.currentTarget.value;
    const data = {
      ...props.indicateur,
    };
    data.meta["commentaire"] = inputValue;
    commands.indicateurCommands
      .storeIndicateurPersonnalise(new IndicateurPersonnaliseStorable(data))
      .then((storable) => setValue(storable.meta["commentaire"]));
  }

  return (
    <details>
      <summary>Commentaire</summary>
      <textarea defaultValue={value} onBlur={handleSave} />
    </details>
  );
};

export const IndicateurPersonnaliseCard = (props: {
  indicateur: IndicateurPersonnaliseStorable;
}) => {
  // todo lookup related actions

  return (
    <div className="flex flex-col items-center pt-8 pr-6 pb-6">
      <h3 className="fr-h3 mb-6">{props.indicateur.nom}</h3>
      <IndicateurPersonnaliseValues indicateur={props.indicateur} />
      <DescriptionPanel description={props.indicateur.description} />
      <IndicateurPersonnaliseCommentaire indicateur={props.indicateur} />
    </div>
  );
};
