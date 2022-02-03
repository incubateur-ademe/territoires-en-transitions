import {useParams} from 'react-router-dom';
import {authBloc} from 'core-logic/observables';

export const InvitationLanding = () => {
  const {invitationId} = useParams<{invitationId: string}>();
  if (invitationId) {
    authBloc.invitationId = invitationId;
  }

  return <h1>...</h1>;
};
