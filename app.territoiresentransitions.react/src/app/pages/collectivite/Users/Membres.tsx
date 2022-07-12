import InvitationLink from './InvitationLink';
import {useEffect, useState} from 'react';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {
  PersonneList,
  userList,
  removeUser,
} from 'core-logic/api/procedures/collectiviteProcedures';
import {DcpRead} from 'generated/dataLayer/dcp_read';
import UserCard from './UserCard';
import {useGenerateInvitation} from 'core-logic/hooks/useGenerateInvitation';
import {useAgentInvitation} from 'core-logic/hooks/useAgentInvitation';
import MembreListTable from './components/MembreListTable';
import {
  Membre,
  TMembreFonction,
  TUpdateMembreField,
  updateMembreChampIntervention,
  updateMembreDetailsFonction,
  updateMembreFonction,
  useCollectiviteMembres,
} from 'app/pages/collectivite/Users/membres.io';
import {useAuth} from 'core-logic/api/auth/AuthProvider';

const activeUsersByRole = (
  users: PersonneList[] | null,
  name: string
): DcpRead[] | undefined =>
  users
    ?.find(({niveau_acces}) => niveau_acces === name)
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
export const Membres = ({
  membres,
  currentUserId,
  updateMembreFonction,
}: {
  membres: Membre[];
  currentUserId: string;
  updateMembreFonction: TUpdateMembreField<TMembreFonction>;
}) => {
  const {agents, conseillers, auditeurs, referents, removeFromCollectivite} =
    useUserList();
  const {invitationUrl: latestUrl} = useAgentInvitation();
  const {generateInvitation, invitationUrl} = useGenerateInvitation();

  const onRemove = (user_id: string) => {
    if (
      confirm(
        'Etes-vous sûr de vouloir retirer cette utilisateur de la collectivité ?'
      )
    ) {
      removeFromCollectivite(user_id);
    }
  };

  return (
    <main data-test="Users" className="fr-container mt-10 mb-16">
      <h1 className="mb-10 lg:mb-14 lg:text-center">Gestion des membres</h1>

      <h2 className="">Liste des membres</h2>
      <MembreListTable
        currentUserId={currentUserId}
        membres={membres}
        isLoading={false}
        updateMembreFonction={updateMembreFonction}
      />

      <h2 className="fr-h2">Lien d'invitation</h2>
      <p>
        Envoyez ce lien aux personnes que vous souhaitez inviter à modifier les
        données de votre collectivité.
      </p>

      <InvitationLink
        link={invitationUrl || latestUrl}
        onGenerateLink={generateInvitation}
      />

      {/* <h2 className="fr-h2 mt-4">Contact principal</h2>*/}
      {/* <p className="pb-4">*/}
      {/*   Ces informations sont affichées à toute personne qui demande accès à*/}
      {/*   votre collectivité.*/}
      {/* </p>*/}
      {/* <MainContactForm {...TMP_contactProps} />*/}

      <h2 className="fr-h2 mt-4">Liste des personnes référentes</h2>
      {referents?.map(user => (
        <UserCard key={user.user_id} user={user} onRemove={onRemove} />
      ))}

      {agents ? (
        <>
          <h2 className="fr-h2 mt-4">Liste des utilisateurs</h2>
          <p className="pb-4">
            Lorsque vous retirez un utilisateur, il ne pourra plus modifier les
            informations d’une collectivité.
          </p>
          {agents?.map(user => (
            <UserCard key={user.user_id} user={user} onRemove={onRemove} />
          ))}
        </>
      ) : null}

      {conseillers ? (
        <>
          <h2 className="fr-h2 mt-4 pt-4">Liste des conseillers</h2>
          {conseillers?.map(user => (
            <UserCard key={user.user_id} user={user} />
          ))}
        </>
      ) : null}

      {auditeurs ? (
        <>
          <h2 className="fr-h2 mt-4 pt-4">Auditeur</h2>
          {auditeurs?.map(user => (
            <UserCard key={user.user_id} user={user} />
          ))}
        </>
      ) : null}
    </main>
  );
};

export default () => {
  const auth = useAuth();
  const userId = auth.user?.id;
  const collectiviteId = useCollectiviteId();
  if (!userId || !collectiviteId) return null;

  const membres = useCollectiviteMembres();
  return (
    <Membres
      currentUserId={userId}
      membres={membres}
      updateMembreFonction={(
        membreId: string,
        membreFunction: TMembreFonction
      ) => {
        updateMembreFonction(collectiviteId, membreId, membreFunction);
        updateMembreDetailsFonction(
          collectiviteId,
          membreId,
          'King of the universe ' + membreFunction
        );
        updateMembreChampIntervention(collectiviteId, membreId, ['eci']);
      }}
    />
  );
};
