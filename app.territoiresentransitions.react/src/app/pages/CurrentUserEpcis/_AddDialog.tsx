import {allEpciReadEndpoint} from 'core-logic/api/endpoints/EpciReadEndpoints';
import {claimEpci} from 'core-logic/api/procedures/ClaimEpciProcedure';
import {AllEpciRead} from 'generated/dataLayer/all_epci_read';
import React, {useEffect, useState} from 'react';
import {SelectInput, UiDialogButton} from 'ui';
import {ownedEpciBloc} from 'core-logic/observables/OwnedEpciBloc';

export const AddDialog = () => {
  const [opened, setOpened] = React.useState<boolean>(false);

  const [allEpciReads, setAllEpciReads] = useState<AllEpciRead[]>([]);
  useEffect(() => {
    allEpciReadEndpoint
      .getBy({})
      .then(allEpciReads => setAllEpciReads(allEpciReads));
  }, []);

  const [selectedEpciSiren, setSelectedEpciSiren] = React.useState<string>();

  const submit = async () => {
    console.log('Should add EPCI ', selectedEpciSiren, ' to user rights.... ');
    if (selectedEpciSiren) {
      const claimResult = await claimEpci(selectedEpciSiren);
    }
    close();
  };

  return (
    <UiDialogButton
      title="Rejoindre une collectivité"
      opened={opened}
      setOpened={setOpened}
    >
      <div className="py-7">
        <div className="flex flex-row justify-center">
          <SelectInput
            label="Sélectionner une collectivité"
            options={allEpciReads.map((epciRead: AllEpciRead) => {
              return {
                value: epciRead.siren,
                label: epciRead.nom,
              };
            })}
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
            Rejoindre cette collectivité
          </button>
        </div>
      </div>
    </UiDialogButton>
  );
};
