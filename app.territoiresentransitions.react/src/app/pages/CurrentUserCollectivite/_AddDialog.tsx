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
import {makeTableauBordUrl} from 'app/paths';
import {currentCollectiviteBloc} from 'core-logic/observables';

const _JoinCollectiviteDialogContent = ({
  collectivite,
  referentContactResponse,
}: {
  collectivite: AllCollectiviteRead;
  referentContactResponse: ReferentContactResponse;
}) => (
  <div>
    <div className="flex justify-center mt-8">
      Pour rejoindre "{collectivite.nom}", contactez le référent{' '}
      {referentContactResponse.prenom} {referentContactResponse.nom} par mail{' '}
      {referentContactResponse.email}
    </div>
  </div>
);

const _ClaimCollectiviteDialogContent = ({
  collectivite,
  bloc,
}: {
  collectivite: AllCollectiviteRead;
  bloc: OwnedCollectiviteBloc;
}) => {
  const [success, setSuccess] = useState<boolean | null>(null);

  const onClick = async () => {
    const claimSuccess = await bloc.claim(collectivite.collectivite_id);
    setSuccess(claimSuccess);
  };

  if (success === null)
    return (
      <div className="items-center">
        <ul>
          <li>Vous souhaitez rejoindre {collectivite.nom}</li>
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
        <div>Vous avez activé la collectivité {collectivite.nom}</div>
        <Link
          className="fr-btn"
          to={makeTableauBordUrl({
            collectiviteId: collectivite.collectivite_id,
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

const _ConditionalSelectDialogContent = ({
  collectivite,
}: {
  collectivite?: AllCollectiviteRead;
}) => {
  const [referentContactResponse, setReferentContactResponse] =
    useState<ReferentContactResponse | null>(null);

  useEffect(() => {
    if (collectivite) {
      console.log(collectivite);
      referentContact(collectivite.collectivite_id).then(contact => {
        setReferentContactResponse(contact);
      });
    }
  }, [collectivite?.collectivite_id]);

  if (!collectivite) return null;

  if (referentContactResponse)
    return (
      <_JoinCollectiviteDialogContent
        referentContactResponse={referentContactResponse}
        collectivite={collectivite}
      />
    );
  return (
    <_ClaimCollectiviteDialogContent
      bloc={ownedCollectiviteBloc}
      collectivite={collectivite}
    />
  );
};
export const JoinCurrentCollectiviteDialog = () => {
  const collectivite = currentCollectiviteBloc.currentCollectivite!;
  const [opened, setOpened] = React.useState<boolean>(false);

  return (
    <UiDialogButton
      title="Rejoindre cette collectivité"
      opened={opened}
      setOpened={setOpened}
      buttonClasses="fr-btn--secondary fr-btn--sm bg-white"
    >
      <_ConditionalSelectDialogContent collectivite={collectivite} />
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

  const [selectedCollectivite, setSelectedCollectivite] =
    React.useState<AllCollectiviteRead>();

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
                  value: collectiviteRead.collectivite_id.toString(),
                  label: collectiviteRead.nom,
                };
              }
            )}
            defaultValue=""
            onChange={collectiviteId => {
              const parsedCollectiviteId = parseInt(collectiviteId);
              if (
                parsedCollectiviteId !== selectedCollectivite?.collectivite_id
              ) {
                setSelectedCollectivite(
                  allCollectiviteReads.find(
                    c => c.collectivite_id === parsedCollectiviteId
                  )
                );
              }
            }}
          />
        </div>
        <Spacer />
        <_ConditionalSelectDialogContent collectivite={selectedCollectivite} />
      </div>
    </UiDialogButton>
  );
};
