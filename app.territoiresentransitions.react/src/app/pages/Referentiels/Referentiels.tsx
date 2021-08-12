import "app/DesignSystem/core.css";
import { SelectInput } from "ui";
import type { Option } from "ui";

import React from "react";
import { ActionsEconomieCirculaire } from "./_ReferentielEconomieCirculaire";
import { actions } from "generated/data/referentiels";

type View = "cae" | "eci" | "both";

const ConditionnalActionsReferentiels = ({ view }: { view: View }) => {
  if (view === "cae") return <div>CLIMAT AIR ENERGIE</div>;
  else if (view === "both") return <div>VUE COMBINEE</div>;
  else return <ActionsEconomieCirculaire actions={actions} />;
};

export const ActionsReferentiels = () => {
  const viewOptions: Option<View>[] = [
    { value: "cae", label: "Climat Air Énergie" },
    { value: "eci", label: "Économie Circulaire" },
    { value: "both", label: "Vue combinée" },
  ];

  const [view, setView] = React.useState<View>("eci");

  //   .pageIntro {
  //     margin-top: 2.25rem;
  //     margin-bottom: 3.75rem;
  // }

  // .pageIntro > div {
  //     display: flex;
  //     align-items: center;
  //     justify-content: space-between;
  // }

  // .pageIntro > div + div {
  //     margin-top: 1.875rem;
  // }

  // .pageIntro h1 {
  //     margin-bottom: 0;
  // }

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
