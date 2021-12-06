import {allEpciReadEndpoint} from 'core-logic/api/endpoints/EpciReadEndpoints';
import {AllEpciRead} from 'generated/dataLayer/all_epci_read';
import React, {useEffect, useState} from 'react';
import {SelectInput, UiDialogButton} from 'ui';
import {
  OwnedEpciBloc,
  ownedEpciBloc,
} from 'core-logic/observables/OwnedEpciBloc';
import {
  ReferentContactResponse,
  referentContact,
} from 'core-logic/api/procedures/epciProcedures';
import {Spacer} from 'ui/shared';
import {Link} from 'react-router-dom';
import {makeEpciTabPath} from 'app/paths';

const _JoinEpciDialogContent = ({
  siren,
  referentContactResponse,
}: {
  siren: string;
  referentContactResponse: ReferentContactResponse;
}) => (
  <div>
    <div className="flex justify-center mt-8">
      Pour rejoindre l'EPCI {siren}, contacter le référent{' '}
      {referentContactResponse.prenom} {referentContactResponse.nom} par mail{' '}
      {referentContactResponse.email}
    </div>
  </div>
);

const _ClaimEpciDialogContent = ({
  siren,
  bloc,
}: {
  siren: string;
  bloc: OwnedEpciBloc;
}) => {
  const [success, setSuccess] = useState<boolean | null>(null);

  const onClick = async () => {
    const claimSuccess = await bloc.claim(siren);
    setSuccess(claimSuccess);
  };

  if (success === null)
    return (
      <div className="items-center">
        <ul>
          <li>Vous souhaitez rejoindre {siren}</li>
          <li>Cette collectivité n'est pas encore active.</li>
          <li className="font-bold">
            Souhaitez-vous activer cette collectivité et en être le référent ?
          </li>
        </ul>
        {/* <button className="fr-btn fr-btn--sm" onClick={onClick}>
          Activer
        </button> */}
        <Link
          className="fr-btn fr-btn--sm"
          onClick={onClick}
          to={makeEpciTabPath({siren, tab: 'tableau_bord'})}
        >
          Activer
        </Link>
      </div>
    );
  else if (success)
    return (
      <div>
        <div>Vous avez activé la collectivité {siren}</div>
        <Link
          className="btn-fr"
          to={makeEpciTabPath({siren, tab: 'tableau_bord'})}
        />
      </div>
    );
  else
    return (
      <div>
        Une erreur est survenue. Vous n'avez pas pu activer cette collectivité.{' '}
      </div>
    );
};

const _ConditionalSelectDialog = ({siren}: {siren?: string}) => {
  const [referentContactResponse, setReferentContactResponse] =
    useState<ReferentContactResponse | null>(null);

  if (!siren) return null;

  referentContact(siren).then(contact => {
    setReferentContactResponse(contact);
  });

  if (referentContactResponse)
    return (
      <_JoinEpciDialogContent
        referentContactResponse={referentContactResponse}
        siren={siren}
      />
    );
  return <_ClaimEpciDialogContent bloc={ownedEpciBloc} siren={siren} />;
};
export const JoinCurrentEpciDialog = ({siren}: {siren: string}) => {
  const [opened, setOpened] = React.useState<boolean>(false);
  const [referentContactResponse, setReferentContactResponse] =
    useState<ReferentContactResponse | null>(null);

  referentContact(siren).then(contact => {
    setReferentContactResponse(contact);
  });

  console.log('JoinCurrentEpciDialog : ', siren, referentContactResponse);

  return (
    <UiDialogButton
      title="Rejoindre cette collectivité"
      opened={opened}
      setOpened={setOpened}
      buttonClasses="fr-btn--secondary fr-btn--sm bg-white"
    >
      {referentContactResponse && (
        <_JoinEpciDialogContent
          siren={siren}
          referentContactResponse={referentContactResponse}
        />
      )}
    </UiDialogButton>
  );
};

export const SelectEpciDialog = () => {
  const [opened, setOpened] = React.useState<boolean>(false);
  const [allEpciReads, setAllEpciReads] = useState<AllEpciRead[]>([]);

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
        <_ConditionalSelectDialog siren={selectedEpciSiren} />
      </div>
    </UiDialogButton>
  );
};
