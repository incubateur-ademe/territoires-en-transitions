import {allEpciReadEndpoint} from 'core-logic/api/endpoints/EpciReadEndpoints';
import {AllEpciRead} from 'generated/dataLayer/all_epci_read';
import React, {useEffect, useState} from 'react';
import {SelectInput, UiDialogButton} from 'ui';
import {ownedEpciBloc} from 'core-logic/observables/OwnedEpciBloc';
import {
  ReferentContactResponse,
  referentContact,
} from 'core-logic/api/procedures/epciProcedures';
import {Spacer} from 'ui/shared';

const ConditionalAddDialog = ({
  siren,
  claimEpciAndCloseDialog,
}: {
  siren?: string;
  claimEpciAndCloseDialog: (siren: string) => () => Promise<void>;
}) => {
  const [referentContactResponse, setReferentContactResponse] =
    useState<ReferentContactResponse | null>(null);
  if (!siren) return null;
  referentContact(siren).then(contact => {
    setReferentContactResponse(contact);
  });
  if (referentContactResponse)
    return (
      <div>
        <div className="flex justify-center mt-8">
          Pour rejoindre l'EPCI {siren}, contacter le référent{' '}
          {referentContactResponse.prenom} {referentContactResponse.nom} par
          mail {referentContactResponse.email}
        </div>
      </div>
    );
  else
    return (
      <div className="items-center">
        <p>Vous êtes preum's</p>
        <button
          className="fr-btn fr-btn--sm"
          onClick={claimEpciAndCloseDialog(siren)}
        >
          Activer {siren}
        </button>
      </div>
    );
};

export const AddDialog = () => {
  const [opened, setOpened] = React.useState<boolean>(false);
  const [allEpciReads, setAllEpciReads] = useState<AllEpciRead[]>([]);

  const claimEpciAndCloseDialog = (siren: string) => async () => {
    await ownedEpciBloc.claim(siren);
    setOpened(false);
  };

  useEffect(() => {
    allEpciReadEndpoint
      .getBy({})
      .then(allEpciReads => setAllEpciReads(allEpciReads));
  }, []);

  const [selectedEpciSiren, setSelectedEpciSiren] = React.useState<string>();

  return (
    <UiDialogButton
      title="Sélectionner votre collectivité"
      opened={opened}
      setOpened={setOpened}
    >
      <div className="py-7">
        <div className="flex flex-row justify-center">
          <SelectInput
            label="Sélectionner votre collectivité"
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
        <Spacer />
        <ConditionalAddDialog
          siren={selectedEpciSiren}
          claimEpciAndCloseDialog={claimEpciAndCloseDialog}
        />
      </div>
    </UiDialogButton>
  );
};
