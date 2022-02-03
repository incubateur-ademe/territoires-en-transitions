import {makeAutoObservable, reaction} from 'mobx';
import {
  createAgentInvitation,
  fetchAgentInvitation,
} from 'core-logic/api/procedures/invitationProcedures';
import {currentCollectiviteBloc} from 'core-logic/observables';
import {makeInvitationLandingPath} from 'app/paths';

export class InvitationBloc {
  private _agentInvitationId: string | null = null;
  private _invitationError: string | null = null;

  constructor() {
    makeAutoObservable(this);
    // listen to collectivite bloc changes
    reaction(
      () => currentCollectiviteBloc.collectiviteId,
      collectiviteId => {
        this.setAgentInvitationId(null);
        fetchAgentInvitation(collectiviteId!)
          .then(latestInvitationResponse => {
            console.log(
              'change collectivite : reset link to ',
              latestInvitationResponse.id
            );
            this.setAgentInvitationId(latestInvitationResponse.id ?? null);
          })
          .catch(error => {
            console.log(
              'Error while fetching latest invitation from ',
              collectiviteId,
              error
            );
            this.setInvitationError(JSON.stringify(error));
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

  get agentInvitationUrl(): string | null {
    return (
      this._agentInvitationId &&
      makeInvitationLandingPath(this._agentInvitationId)
    );
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
