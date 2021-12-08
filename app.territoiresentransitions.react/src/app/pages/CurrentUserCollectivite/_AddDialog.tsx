import {allCollectiviteReadEndpoint} from 'core-logic/api/endpoints/CollectiviteReadEndpoints';
import {AllCollectiviteRead} from 'generated/dataLayer/all_collectivite_read';
import React, {useEffect, useState} from 'react';
import {SelectInput, UiDialogButton} from 'ui';
import {
  OwnedCollectiviteBloc,
  ownedCollectiviteBloc,
} from 'core-logic/observables/OwnedCollectiviteBloc';
import {
  ReferentContactResponse,
  referentContact,
} from 'core-logic/api/procedures/collectiviteProcedures';
import {Spacer} from 'ui/shared';
import {Link} from 'react-router-dom';
import {makeCollectiviteTabPath} from 'app/paths';

const _JoinCollectiviteDialogContent = ({
  collectiviteId,
  referentContactResponse,
}: {
  collectiviteId: number;
  referentContactResponse: ReferentContactResponse;
}) => (
  <div>
    <div className="flex justify-center mt-8">
      Pour rejoindre l'Collectivite {collectiviteId}, contacter le référent{' '}
      {referentContactResponse.prenom} {referentContactResponse.nom} par mail{' '}
      {referentContactResponse.email}
    </div>
  </div>
);

const _ClaimCollectiviteDialogContent = ({
  collectiviteId,
  bloc,
}: {
  collectiviteId: number;
  bloc: OwnedCollectiviteBloc;
}) => {
  const [success, setSuccess] = useState<boolean | null>(null);

  const onClick = async () => {
    const claimSuccess = await bloc.claim(collectiviteId);
    setSuccess(claimSuccess);
  };

  if (success === null)
    return (
      <div className="items-center">
        <ul>
          <li>Vous souhaitez rejoindre #{collectiviteId}</li>
          <li>Cette collectivité n'est pas encore active.</li>
          <li className="font-bold">
            Souhaitez-vous activer cette collectivité et en être le référent ?
          </li>
        </ul>
        <button className="fr-btn fr-btn--sm" onClick={onClick}>
          Activer
        </button>
      </div>
    );
  else if (success)
    return (
      <div>
        <div>Vous avez activé la collectivité #{collectiviteId}</div>
        <Link
          className="fr-btn"
          to={makeCollectiviteTabPath({
            id: collectiviteId,
            tab: 'tableau_bord',
          })}
        >
          Tableau de bord
        </Link>
      </div>
    );
  else
    return (
      <div>
        Une erreur est survenue. Vous n'avez pas pu activer cette collectivité.{' '}
      </div>
    );
};

const _ConditionalSelectDialog = ({
  collectiviteId,
}: {
  collectiviteId?: number;
}) => {
  const [referentContactResponse, setReferentContactResponse] =
    useState<ReferentContactResponse | null>(null);

  useEffect(() => {
    if (collectiviteId) {
      referentContact(collectiviteId).then(contact => {
        setReferentContactResponse(contact);
      });
    }
  }, [collectiviteId]);

  if (!collectiviteId) return null;

  if (referentContactResponse)
    return (
      <_JoinCollectiviteDialogContent
        referentContactResponse={referentContactResponse}
        collectiviteId={collectiviteId}
      />
    );
  return (
    <_ClaimCollectiviteDialogContent
      bloc={ownedCollectiviteBloc}
      collectiviteId={collectiviteId}
    />
  );
};
export const JoinCurrentCollectiviteDialog = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) => {
  const [opened, setOpened] = React.useState<boolean>(false);
  const [referentContactResponse, setReferentContactResponse] =
    useState<ReferentContactResponse | null>(null);

  referentContact(collectiviteId).then(contact => {
    setReferentContactResponse(contact);
  });

  console.log(
    'JoinCurrentCollectiviteDialog : #',
    collectiviteId,
    referentContactResponse
  );

  return (
    <UiDialogButton
      title="Rejoindre cette collectivité"
      opened={opened}
      setOpened={setOpened}
      buttonClasses="fr-btn--secondary fr-btn--sm bg-white"
    >
      {referentContactResponse && (
        <_JoinCollectiviteDialogContent
          collectiviteId={collectiviteId}
          referentContactResponse={referentContactResponse}
        />
      )}
    </UiDialogButton>
  );
};

export const SelectCollectiviteDialog = () => {
  const [opened, setOpened] = React.useState<boolean>(false);
  const [allCollectiviteReads, setAllCollectiviteReads] = useState<
    AllCollectiviteRead[]
  >([]);

  useEffect(() => {
    allCollectiviteReadEndpoint
      .getBy({})
      .then(allCollectiviteReads =>
        setAllCollectiviteReads(allCollectiviteReads)
      );
  }, []);

  const [selectedCollectiviteId, setSelectedCollectiviteId] =
    React.useState<number>();

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
            options={allCollectiviteReads.map(
              (collectiviteRead: AllCollectiviteRead) => {
                return {
                  value: collectiviteRead.id.toString(),
                  label: collectiviteRead.nom,
                };
              }
            )}
            defaultValue=""
            onChange={collectiviteId => {
              const parsedCollectiviteId = parseInt(collectiviteId);
              if (parsedCollectiviteId !== selectedCollectiviteId)
                setSelectedCollectiviteId(parsedCollectiviteId);
            }}
          />
        </div>
        <Spacer />
        <_ConditionalSelectDialog collectiviteId={selectedCollectiviteId} />
      </div>
    </UiDialogButton>
  );
};
