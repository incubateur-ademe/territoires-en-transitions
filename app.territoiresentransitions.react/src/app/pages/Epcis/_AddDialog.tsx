import Dialog from '@material-ui/core/Dialog';
import {useActions} from 'core-logic/overmind';
import React from 'react';
import {EpciStorable} from 'storables/EpciStorable';
import {LabeledTextInput, SelectInput} from 'ui';

export interface AddDialogProps {
  open: boolean;
  close: () => void;
  epcis: EpciStorable[];
}

export const AddDialog = (props: AddDialogProps) => {
  const {open, close, epcis} = props;
  const selectInputValues = epcis.map(epciStorable => ({
    value: epciStorable.id,
    label: epciStorable.nom,
  }));

  const [selectedEpciId, setSelectedEpciId] = React.useState('');
  const [inputEpciNom, setInputEpciNom] = React.useState('');

  const overmindActions = useActions();

  const submit = async () => {
    if (selectedEpciId) {
      // Add rights.
      // const auth = await import("../../api/authentication");
      // await auth.addDroits(selectedEpciId, true);
      await overmindActions.epcis.addEpciToMyList(selectedEpciId);
    } else if (inputEpciNom.trim()) {
      // Create Epci
      await overmindActions.epcis.createNewEpci(inputEpciNom);
    }

    close();
  };

  return (
    <Dialog open={open} onClose={close} maxWidth="md" fullWidth={true}>
      <div className="py-7">
        <h3 className="text-center pb-4"> Ajouter ma collectivité </h3>
        <div className="flex flex-row w-full">
          <div className="flex flex-col w-1/2 p-5">
            <h1 className="text-xl">Ma collectivité a déjà un compte</h1>
            <SelectInput
              label="Sélectionner une collectivité"
              options={selectInputValues}
              defaultValue=""
              onChange={epciId => {
                console.log(epciId);
                setSelectedEpciId(epciId);
              }}
            />
          </div>
          <div className="flex flex-col w-1/2 p-5">
            <h1 className="text-xl">
              Ma collectivité n'a pas encore de compte
            </h1>
            <LabeledTextInput
              label="Créer une collectivité"
              maxLength={100}
              onChange={event => {
                setInputEpciNom(event.target.value);
              }}
            />
          </div>
        </div>

        <div className="flex justify-center mt-8">
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
