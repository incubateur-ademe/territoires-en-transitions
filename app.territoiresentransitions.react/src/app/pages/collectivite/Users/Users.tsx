import {useEffect, useState} from 'react';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {
  PersonneList,
  userList,
  removeUser,
} from 'core-logic/api/procedures/collectiviteProcedures';
import {DcpRead} from 'generated/dataLayer/dcp_read';
import InvitationForm from './components/InvitationForm';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';

const activeUsersByRole = (
  users: PersonneList[] | null,
  name: string
): DcpRead[] | undefined =>
  users
    ?.find(({role_name}) => role_name === name)
    ?.personnes.filter(({deleted}) => !deleted);

const useUserList = () => {
  const [users, setUsers] = useState<PersonneList[] | null>(null);
  const collectivite_id = useCollectiviteId();

  const refetch = () => {
    if (collectivite_id) {
      userList(collectivite_id).then(setUsers);
    }
  };

  useEffect(() => {
    refetch();
  }, [collectivite_id]);

  const agents = activeUsersByRole(users, 'agent');
  const conseillers = activeUsersByRole(users, 'conseiller');
  const auditeurs = activeUsersByRole(users, 'auditeur');
  const referents = activeUsersByRole(users, 'referent');

  const removeFromCollectivite = (user_id: string) => {
    if (collectivite_id) {
      removeUser(collectivite_id, user_id).then(refetch);
    }
  };

  return {
    agents,
    conseillers,
    auditeurs,
    referents,
    removeFromCollectivite,
  };
};
/**
 * Affiche la page listant les utilisateurs attachés à une collectivité
 * et le formulaire permettant d'envoyer des liens d'invitation
 */
const Users = () => {
  const {agents, conseillers, auditeurs, referents, removeFromCollectivite} =
    useUserList();

  const collectivite = useCurrentCollectivite();

  const onRemove = (user_id: string) => {
    if (
      confirm(
        'Etes-vous sûr de vouloir retirer cette utilisateur de la collectivité ?'
      )
    ) {
      removeFromCollectivite(user_id);
    }
  };

  type FakeAcces = 'admin' | 'edition' | 'lecture';

  type FakeCurrentUser = {
    nom: string;
    prenom: string;
    email: string;
    acces: FakeAcces;
  };

  const fakeCurrentUser: FakeCurrentUser = {
    nom: 'Yolo',
    prenom: 'Dodo',
    email: 'Yolo@Dodo.de',
    acces: 'admin',
  };

  return (
    <main data-test="Users" className="fr-container mt-9 mb-16">
      <h1 className="fr-h1 mb-3 whitespace-nowrap mr-4">Collaboration</h1>
      {(fakeCurrentUser.acces === 'admin' ||
        fakeCurrentUser.acces === 'edition') && (
        <>
          <h2 className="fr-h2">Invitation</h2>
          <p className="italic text-gray-500">
            Tous les champs sont obligatoires
          </p>

          {collectivite && (
            <InvitationForm
              currentUser={fakeCurrentUser}
              currentCollectivite={collectivite}
            />
          )}
        </>
      )}
    </main>
  );
};

export default Users;
