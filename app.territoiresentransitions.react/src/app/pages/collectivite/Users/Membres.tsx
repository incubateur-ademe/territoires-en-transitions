import {useCollectiviteId} from 'core-logic/hooks/params';
import {useAuth, UserData} from 'core-logic/api/auth/AuthProvider';
import {
  CurrentCollectivite,
  useCurrentCollectivite,
} from 'core-logic/hooks/useCurrentCollectivite';
import {useUpdateCollectiviteMembre} from 'app/pages/collectivite/Users/useUpdateCollectiviteMembre';
import {useCollectiviteMembres} from 'app/pages/collectivite/Users/useCollectiviteMembres';
import {useRemoveFromCollectivite} from 'app/pages/collectivite/Users/useRemoveFromCollectivite';
import {
  Membre,
  TRemoveFromCollectivite,
  TUpdateMembre,
} from 'app/pages/collectivite/Users/types';
import MembreListTable from 'app/pages/collectivite/Users/components/MembreListTable';
import InvitationForm from 'app/pages/collectivite/Users/components/InvitationForm';
import {
  AddUserToCollectiviteRequest,
  AddUserToCollectiviteResponse,
  useAddUserToCollectivite,
} from 'app/pages/collectivite/Users/useAddUserToCollectivite';

export type MembresProps = {
  membres: Membre[];
  collectivite: CurrentCollectivite;
  isLoading: boolean;
  currentUser: UserData;
  updateMembre: TUpdateMembre;
  removeFromCollectivite: TRemoveFromCollectivite;
  addUser: (request: AddUserToCollectiviteRequest) => void;
  addUserResponse: AddUserToCollectiviteResponse | null;
  resetAddUser: () => void;
};

/**
 * Affiche la page listant les utilisateurs attachés à une collectivité
 * et le formulaire permettant d'envoyer des liens d'invitation
 */
export const Membres = ({
  membres,
  collectivite,
  isLoading,
  currentUser,
  updateMembre,
  removeFromCollectivite,
  addUser,
  addUserResponse,
  resetAddUser,
}: MembresProps) => {
  const canViewInvitation =
    collectivite.niveau_acces === 'admin' ||
    collectivite.niveau_acces === 'edition';

  return (
    <main data-test="Users" className="fr-container mt-9 mb-16">
      <h1 className="mb-10 lg:mb-14 lg:text-center">Gestion des membres</h1>

      <h2 className="">Liste des membres</h2>
      <MembreListTable
        currentUserId={currentUser.id}
        currentUserAccess={
          collectivite.niveau_acces ? collectivite.niveau_acces : 'lecture'
        }
        membres={membres}
        isLoading={isLoading}
        updateMembre={updateMembre}
        removeFromCollectivite={removeFromCollectivite}
      />

      {canViewInvitation && (
        <>
          <h2 className="mt-12">Invitation</h2>
          <p className="italic text-gray-500">
            Tous les champs sont obligatoires
          </p>
          <InvitationForm
            addUser={addUser}
            addUserResponse={addUserResponse}
            resetAddUser={resetAddUser}
            currentUser={currentUser}
            currentCollectivite={collectivite}
          />
        </>
      )}
    </main>
  );
};

export default () => {
  const auth = useAuth();
  const user = auth.user;
  const collectivite_id = useCollectiviteId();
  const collectivite = useCurrentCollectivite();

  const {membres, isLoading: isMemberLoading} = useCollectiviteMembres();
  const {updateMembre} = useUpdateCollectiviteMembre();
  const {removeFromCollectivite} = useRemoveFromCollectivite();
  const {addUser, addUserResponse, resetAddUser} = useAddUserToCollectivite();

  if (!user?.id || !collectivite_id || !collectivite) return null;

  return (
    <Membres
      addUser={addUser}
      addUserResponse={addUserResponse}
      resetAddUser={resetAddUser}
      currentUser={user}
      membres={membres}
      collectivite={collectivite}
      updateMembre={updateMembre}
      removeFromCollectivite={removeFromCollectivite}
      isLoading={isMemberLoading}
    />
  );
};
