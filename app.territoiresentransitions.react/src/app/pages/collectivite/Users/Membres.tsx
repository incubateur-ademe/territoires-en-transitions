import InvitationLink from './InvitationLink';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useGenerateInvitation} from 'core-logic/hooks/useGenerateInvitation';
import {useAgentInvitation} from 'core-logic/hooks/useAgentInvitation';
import {useAuth} from 'core-logic/api/auth/AuthProvider';
import {useUpdateCollectiviteMembre} from './useUpdateCollectiviteMembre';
import {useCollectiviteMembres} from './useCollectiviteMembres';
import {useRemoveFromCollectivite} from './useRemoveFromCollectivite';
import {Membre, TRemoveFromCollectivite, TUpdateMembre} from './types';
import MembreListTable from './components/MembreListTable';

/**
 * Affiche la page listant les utilisateurs attachés à une collectivité
 * et le formulaire permettant d'envoyer des liens d'invitation
 */
export const Membres = ({
  membres,
  isLoading,
  currentUserId,
  updateMembre,
  removeFromCollectivite,
}: {
  membres: Membre[];
  isLoading: boolean;
  currentUserId: string;
  updateMembre: TUpdateMembre;
  removeFromCollectivite: TRemoveFromCollectivite;
}) => {
  const {invitationUrl: latestUrl} = useAgentInvitation();
  const {generateInvitation, invitationUrl} = useGenerateInvitation();

  return (
    <main data-test="Users" className="fr-container mt-10 mb-16">
      <h1 className="mb-10 lg:mb-14 lg:text-center">Gestion des membres</h1>

      <h2 className="">Liste des membres</h2>
      <MembreListTable
        currentUserId={currentUserId}
        membres={membres}
        isLoading={isLoading}
        updateMembre={updateMembre}
        removeFromCollectivite={removeFromCollectivite}
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
    </main>
  );
};

export default () => {
  const auth = useAuth();
  const userId = auth.user?.id;
  const collectivite_id = useCollectiviteId();
  if (!userId || !collectivite_id) return null;

  const {membres, isLoading} = useCollectiviteMembres();
  const {updateMembre} = useUpdateCollectiviteMembre();
  const {removeFromCollectivite} = useRemoveFromCollectivite();
  return (
    <Membres
      currentUserId={userId}
      membres={membres}
      updateMembre={updateMembre}
      removeFromCollectivite={removeFromCollectivite}
      isLoading={isLoading}
    />
  );
};
