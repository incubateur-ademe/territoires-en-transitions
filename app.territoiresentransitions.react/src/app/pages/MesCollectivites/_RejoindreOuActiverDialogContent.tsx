import {makeCollectiviteTableauBordUrl} from 'app/paths';
import {ReferentContact} from 'core-logic/api/procedures/collectiviteProcedures';
import {
  OwnedCollectiviteBloc,
  ownedCollectiviteBloc,
} from 'core-logic/observables/OwnedCollectiviteBloc';
import {AllCollectiviteRead} from 'generated/dataLayer/all_collectivite_read';
import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

const _RejoindreCollectiviteDialogContent = ({
  collectivite,
  referentContacts,
}: {
  collectivite: AllCollectiviteRead;
  referentContacts: ReferentContact[];
}) => {
  return referentContacts.length === 1 ? (
    <div>
      <div className="flex justify-center mt-8">
        Pour rejoindre {collectivite.nom}, contactez la personne référente{' '}
        {referentContacts[0].prenom} {referentContacts[0].nom} à l'adresse{' '}
        {referentContacts[0].email}.
      </div>
    </div>
  ) : (
    <div>
      <div className="flex flex-col justify-center mt-8">
        Pour rejoindre {collectivite.nom}, contactez l'une des personnes
        référentes par mail :
        <ul className="ml-4">
          {referentContacts.map(referentContact => (
            <li>{`${referentContact.prenom} ${referentContact.nom} (${referentContact.email})`}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const _ActiverCollectiviteDialogContent = ({
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
      <div className="items-center" data-test="confirm-selection-msg">
        <ul>
          <li>Vous souhaitez rejoindre {collectivite.nom}</li>
          <li>Cette collectivité n'est pas encore active.</li>
          <li className="font-bold">
            Souhaitez-vous activer cette collectivité et en être la personne
            référente ?
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
          to={makeCollectiviteTableauBordUrl({
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

export type TUiRejoindreOuActiverDialogContentProps = {
  collectivite: AllCollectiviteRead;
  referentContacts: ReferentContact[];
};

export const _RejoindreOuActiverDialogContent = ({
  collectivite,
  getReferentContacts,
}: {
  collectivite: AllCollectiviteRead;
  getReferentContacts: (collectiviteId: number) => Promise<ReferentContact[]>;
}) => {
  const [referentContacts, setReferentContacts] = useState<ReferentContact[]>(
    []
  );

  useEffect(() => {
    if (collectivite) {
      getReferentContacts(collectivite.collectivite_id).then(contacts => {
        setReferentContacts(contacts);
      });
    }
  }, [collectivite?.collectivite_id]);
  if (referentContacts.length === 0)
    return (
      <_ActiverCollectiviteDialogContent
        bloc={ownedCollectiviteBloc}
        collectivite={collectivite}
      />
    );
  return (
    <_RejoindreCollectiviteDialogContent
      referentContacts={referentContacts}
      collectivite={collectivite}
    />
  );
};
