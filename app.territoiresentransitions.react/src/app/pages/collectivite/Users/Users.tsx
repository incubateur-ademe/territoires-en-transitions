import InvitationLink from './InvitationLink';
import MainContactForm from './MainContactForm';
import UserCard from './UserCard';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {InvitationGenerateButton} from 'app/pages/collectivite/Users/InvitationGenerateButton';
import {createAgentInvitation} from 'core-logic/api/procedures/invitationProcedures';
import {useState} from 'react';
import {
  InvitationBloc,
  invitationBloc,
} from 'core-logic/observables/invitationBloc';
import {observer} from 'mobx-react-lite';

// TODO: à connecter à l'API
// const TMP_contactProps = {
//   name: 'Bureau d’appui Cit’ergie',
//   email: 'bureauappui@ademe.fr',
//   onUpdateContact: () => {
//     console.log('TODO!');
//   },
// };
// const TMP_usersListProps = {
//   onRemove: (id: string) => {
//     console.log('TODO: remove id=', id);
//   },
//   users: [
//     {
//       id: '1',
//       name: 'Bécassine Dupont',
//       email: 'becassine.dupont@collectivitedefrance.fr',
//     },
//     {
//       id: '2',
//       name: 'Solène Demonmoulin',
//       email: 'solene.demonmoulin@collectivitedefrance.fr',
//     },
//   ],
//   conseillers: [{id: '3', name: 'nom', email: 'email@domaine.fr'}],
//   auditeur: {id: '3', name: 'nom', email: 'email@domaine.fr'},
// };

/**
 * Affiche la page listant les utilisateurs attachés à une collectivité
 * et le formulaire permettant d'envoyer des liens d'invitation
 */
const Users = observer(({invitationBloc}: {invitationBloc: InvitationBloc}) => {
  return (
    <main className="fr-container mt-9 mb-16">
      <h1 className="fr-h1 mb-3 whitespace-nowrap mr-4">Collaboration</h1>

      <h2 className="fr-h2">Lien d'invitation</h2>
      <p>
        Envoyez ce lien aux personnes que vous souhaitez inviter à modifier les
        données de votre collectivité.
      </p>

      <InvitationLink
        link={invitationBloc.agentInvitationUrl}
        onGenerateLink={() => invitationBloc.generateInvitationId()}
      />

      {/*<h2 className="fr-h2 mt-4">Contact principal</h2>*/}
      {/*<p className="pb-4">*/}
      {/*  Ces informations sont affichées à toute personne qui demande accès à*/}
      {/*  votre collectivité.*/}
      {/*</p>*/}
      {/*<MainContactForm {...TMP_contactProps} />*/}

      {/*<h2 className="fr-h2 mt-4">Liste des utilisateurs</h2>*/}
      {/*<p className="pb-4">*/}
      {/*  Lorsque vous retirez un utilisateur, il ne pourra plus modifier les*/}
      {/*  informations d’une collectivité.*/}
      {/*</p>*/}
      {/*{TMP_usersListProps.users.map(user => (*/}
      {/*  <UserCard*/}
      {/*    key={user.id}*/}
      {/*    user={user}*/}
      {/*    onRemove={TMP_usersListProps.onRemove}*/}
      {/*  />*/}
      {/*))}*/}

      {/*<h2 className="fr-h2 mt-4 pt-4">Liste des conseillers</h2>*/}
      {/*{TMP_usersListProps.conseillers.map(user => (*/}
      {/*  <UserCard key={user.id} user={user} />*/}
      {/*))}*/}

      {/*<h2 className="fr-h2 mt-4 pt-4">Auditeur</h2>*/}
      {/*<UserCard user={TMP_usersListProps.auditeur} />*/}
    </main>
  );
});

export default Users;
