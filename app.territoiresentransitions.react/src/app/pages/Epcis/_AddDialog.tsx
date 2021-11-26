import Dialog from '@material-ui/core/Dialog';
import {commands} from 'core-logic/commands';
import {EpciRead} from 'generated/dataLayer/epci_read';
import React from 'react';
import {EpciStorable} from 'storables';
import {LabeledTextInput, SelectInput} from 'ui';

export interface AddDialogProps {
  open: boolean;
  close: () => void;
  epcis: EpciRead[];
}

export const AddDialog = (props: AddDialogProps) => {
  const {open, close, epcis} = props;
  const selectInputValues = epcis.map(epciStorable => ({
    value: epciStorable.siren,
    label: epciStorable.nom,
  }));

  const [selectedEpciSiren, setSelectedEpciSiren] = React.useState<string>();
  // const [inputEpciNom, setInputEpciNom] = React.useState('');

  // const overmindActions = useActions();

  const submit = async () => {
    console.log('Should add EPCI ', selectedEpciSiren, ' to user rights.... ');
    // await commands.epcisCommands.addEpciToMyList(selectedEpciId);
    close();
  };

  return (
    <Dialog open={open} onClose={close} maxWidth="md" fullWidth={true}>
      <div className="py-7">
        <h3 className="text-center pb-4"> Rejoindre ma collectivité </h3>
        <div className="flex flex-row justify-center">
          <SelectInput
            label="Sélectionner une collectivité"
            options={selectInputValues}
            defaultValue=""
            onChange={epciSiren => {
              setSelectedEpciSiren(epciSiren);
            }}
          />
        </div>

        <div className="flex justify-center mt-8">
          <button
            className="fr-btn fr-btn--secondary fr-btn--sm"
            onClick={submit}
          >
            Rejoindre
          </button>
        </div>
      </div>
    </Dialog>
  );
};
