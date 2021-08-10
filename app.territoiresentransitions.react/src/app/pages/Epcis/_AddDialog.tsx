import Dialog from "@material-ui/core/Dialog";
import { overmind } from "core-logic/overmind";
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
    key: epciStorable.id,
    label: epciStorable.nom,
  }));

  const [selectedEpciId, setSelectedEpciId] = React.useState("");
  const [inputEpciNom, setInputEpciNom] = React.useState("");

  const submit = async () => {
    if (selectedEpciId) {
      // Add rights.
      // const auth = await import("../../api/authentication");
      // await auth.addDroits(selectedEpciId, true);
      await overmind.actions.setCurrentEpci(selectedEpciId);
    } else if (inputEpciNom.trim()) {
      // await actions.createNewEpci({ state }, selectedEpciId);
      await overmind.actions.setCurrentEpci(selectedEpciId);
      console.log("creating new epci with name ", inputEpciNom);
      // Create Epci
      await overmind.actions.createNewEpci(inputEpciNom);
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
              values={selectInputValues}
              onChange={(epciId) => {
                console.log(epciId);
                setSelectedEpciId(epciId);
              }}
            />
            {/* <SelectInput bind:value={selectedEpciId} label="Nom de ma collectivité">
                    <option value="">Sélectionnez une collectivité</option>
                    {#each epcis as epci}
                        <option value="{epci.id}">{epci.nom}</option>
                    {/each}
                </SelectInput> */}
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
