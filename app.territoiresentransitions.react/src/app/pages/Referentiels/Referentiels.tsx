import "app/DesignSystem/core.css";
import { SelectInput } from "ui";

import React from "react";
import { ReferentielEconomieCirculaire } from "./_ReferentielEconomieCirculaire";
import { ReferentielClimatAirEnergie } from "./_ReferentielClimatAirEnergie";
import { actions } from "generated/data/referentiels";
import { Options } from "types";

type View = "cae" | "eci" | "both";

const ConditionnalActionsReferentiels = ({ view }: { view: View }) => {
  if (view === "cae") return <ReferentielClimatAirEnergie actions={actions} />;
  else if (view === "both") return <div>VUE COMBINEE</div>;
  else return <ReferentielEconomieCirculaire actions={actions} />;
};

export const ActionsReferentiels = () => {
  const viewOptions: Options<View> = [
    { value: "cae", label: "Climat Air Énergie" },
    { value: "eci", label: "Économie Circulaire" },
    { value: "both", label: "Vue combinée" },
  ];

  const [view, setView] = React.useState<View>("eci");

  return (
    <div className="mt-9 mb-16">
      <div>
        <h1 className="fr-h1 mb-0">Référentiels</h1>
      </div>
      <div>
        <SelectInput<View>
          options={viewOptions}
          label=""
          onChange={setView}
          defaultValue="eci"
        />
      </div>
      <ConditionnalActionsReferentiels view={view} />
    </div>
  );
};

export default ActionsReferentiels;
