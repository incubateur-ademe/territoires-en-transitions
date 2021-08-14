import Dialog from "@material-ui/core/Dialog";
import { useActions } from "core-logic/overmind";
import React from "react";
import { EpciStorable } from "storables/EpciStorable";
import { LabeledTextInput, SelectInput } from "ui";

export interface AddDialogProps {
  open: boolean;
  close: () => void;
  epcis: EpciStorable[];
}

export const AddDialog = (props: AddDialogProps) => {
  const { open, close, epcis } = props;
  const selectInputValues = epcis.map((epciStorable) => ({
    value: epciStorable.id,
    label: epciStorable.nom,
  }));

  const [selectedEpciId, setSelectedEpciId] = React.useState("");
  const [inputEpciNom, setInputEpciNom] = React.useState("");

  const overmindActions = useActions();

  const submit = async () => {
    if (selectedEpciId) {
      // Add rights.
      // const auth = await import("../../api/authentication");
      // await auth.addDroits(selectedEpciId, true);
      await overmindActions.epcis.setCurrentEpci(selectedEpciId);
    } else if (inputEpciNom.trim()) {
      // await actions.createNewEpci({ state }, selectedEpciId);
      await overmindActions.epcis.setCurrentEpci(selectedEpciId);
      // Create Epci
      await overmindActions.epcis.createNewEpci(inputEpciNom);
    }

    close();
  };

  return (
    <Dialog open={open} onClose={close}>
      <div>
        <div className="flex">
          <div className="flex flex-col">
            <h1 className="text-xl">Ma collectivité a déjà un compte</h1>
            <SelectInput
              label="Nom de ma collectivité"
              options={selectInputValues}
              defaultValue=""
              onChange={(epciId) => {
                console.log(epciId);
                setSelectedEpciId(epciId);
              }}
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl">
              Ma collectivité n'a pas encore de compte
            </h1>
            <LabeledTextInput
              label="Nom de ma collectivité"
              maxLength={100}
              onChange={setInputEpciNom}
            />
          </div>
        </div>

        <div className="flex justify-center mt-1">
          <button
            className="fr-btn fr-btn--secondary fr-btn--sm"
            onClick={submit}
          >
            Valider
          </button>
        </div>
      </div>
    </Dialog>
  );
};
