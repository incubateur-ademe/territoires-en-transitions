import {makeAutoObservable, reaction} from 'mobx';
import {
  createAgentInvitation,
  fetchAgentInvitation,
} from 'core-logic/api/procedures/invitationProcedures';
import {currentCollectiviteBloc} from 'core-logic/observables';

export class InvitationBloc {
  private _agentInvitationId: string | null = null;
  private _invitationError: string | null = null;

  constructor() {
    makeAutoObservable(this);
    // listen to collectivite bloc changes
    reaction(
      () => currentCollectiviteBloc.collectiviteId,
      collectiviteId => {
        fetchAgentInvitation(collectiviteId!).then(latestInvitationResponse => {
          console.log(
            'change collectivite : reset link to ',
            latestInvitationResponse.id
          );
          this.setAgentInvitationId(latestInvitationResponse.id ?? null);
        });
      }
    );
  }

  generateInvitationId() {
    const collectiviteId = currentCollectiviteBloc.collectiviteId!;
    console.log('generate invitation if for collectivite ', collectiviteId);
    createAgentInvitation(collectiviteId)
      .then(agentInvitationResponse => {
        this.setAgentInvitationId(agentInvitationResponse.id ?? null);
        console.log('link set to ', agentInvitationResponse.id);
      })
      .catch(error => {
        console.log('Invitation error: ', error);
        this.setInvitationError(JSON.stringify(error));
      });
  }

  get agentInvitationId() {
    return this._agentInvitationId;
  }
  get invitationError() {
    return this._invitationError;
  }
  private setAgentInvitationId(agentInvitationId: string | null) {
    this._agentInvitationId = agentInvitationId;
  }
  private setInvitationError(invitationError: string | null) {
    this._invitationError = invitationError;
  }
}

export const invitationBloc = new InvitationBloc();
