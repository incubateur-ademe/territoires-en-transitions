import "app/DesignSystem/core.css";
import { SelectInput } from "ui";
import type { Option } from "ui";

import React from "react";
import { ActionsEconomieCirculaire } from "app/pages/ActionsReferentiels/_ActionsEconomieCirculaire";
import { actions } from "generated/data/actions_referentiels";
import { BrowserRouter as Router, useParams } from "react-router-dom";

type View = "cae" | "eci" | "both";

const ConditionnalActionsReferentiels = ({ view }: { view: View }) => {
  if (view === "cae") return <div>CLIMAT AIR ENERGIE</div>;
  else if (view === "both") return <div>VUE COMBINEE</div>;
  else return <ActionsEconomieCirculaire actions={actions} />;
};

// type ActionsReferentielsProps = {
//   route: Route<typeof routes.actionsReferentiels>;
// };

export const ActionsReferentiels = () => {
  const { epciId } = useParams<{ epciId: string }>();

  const viewOptions: Option<View>[] = [
    { value: "cae", label: "Climat Air Énergie" },
    { value: "eci", label: "Économie Circulaire" },
    { value: "both", label: "Vue combinée" },
  ];

  const [view, setView] = React.useState<View>("eci");

  return (
    <div className="pageIntro">
      <div>
        <h1 className="fr-h1">Référentiels de {epciId}</h1>
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
