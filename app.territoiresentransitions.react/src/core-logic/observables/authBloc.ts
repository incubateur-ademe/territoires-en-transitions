import {makeAutoObservable} from 'mobx';
import {supabaseClient} from 'core-logic/api/supabase';
import {acceptAgentInvitation} from 'core-logic/api/procedures/invitationProcedures';
import {User} from '@supabase/supabase-js';

// TODO : this should be in an other bloc : AcceptInvitationBloc
type invitationState =
  | 'empty'
  | 'waitingForLogin'
  | 'waitingForAcceptation'
  | 'rejected'
  | 'accepted';

export class AuthBloc {
  get invitationState(): invitationState | null {
    return this._invitationState;
  }
  get invitationId(): string | null {
    return this._invitationId;
  }

  set invitationId(value: string | null) {
    if (this._invitationState !== 'empty') {
      console.error('An invitation is already in auth state');
      return;
    }
    this._invitationId = value;
    if (this.connected) {
      this._acceptCurrentInvitation();
    } else {
      this._invitationState = 'waitingForLogin';
    }
  }
  private _userId: string | null = null;
  private _authError: string | null = null;
  private _invitationId: string | null = null;
  private _invitationState: invitationState = 'empty';

  constructor() {
    makeAutoObservable(this);
    const connectedUser = supabaseClient.auth.user();
    if (connectedUser) {
      this.setUserId(connectedUser.id);
    }
  }

  connect({email, password}: {email: string; password: string}) {
    supabaseClient.auth
      .signIn({email, password})
      .then(session => {
        if (session.user) {
          this.setUserId(session.user.id);
          this.setAuthError(null);
          setCrispUserData(session.user);
          if (this._invitationState === 'waitingForLogin')
            this._acceptCurrentInvitation();
        } else {
          console.log(session.error?.message);
          this.setAuthError("L'email et le mot de passe ne correspondent pas.");
          this.setUserId(null);
        }
      })
      .catch(error => {
        console.log('Connection error: ', error);
      });
  }

  disconnect() {
    supabaseClient.auth.signOut().then(response => {
      if (response.error === null) {
        this.setUserId(null);
        clearCrispUserData();
      } else this.setAuthError(response.error.message);
    });
  }

  get connected() {
    return this.userId !== null;
  }
  get authError() {
    return this._authError;
  }
  get userId() {
    return this._userId;
  }

  private setUserId(userId: string | null) {
    this._userId = userId;
  }
  private setAuthError(authError: string | null) {
    this._authError = authError;
  }

  private async _acceptCurrentInvitation() {
    this._invitationState = 'waitingForAcceptation';
    const success = await acceptAgentInvitation(this._invitationId!);
    this._invitationState = success ? 'accepted' : 'rejected';
  }
}

// affecte les données de l'utilisateur connecté à la chatbox
const setCrispUserData = (user: User) => {
  if ('$crisp' in window) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const {$crisp} = window as any;

    // lecture des dcp
    const {id: userId, email} = user;
    supabaseClient
      .from('dcp')
      .select('user_id,nom,prenom')
      .eq('user_id', userId)
      .then(({data}) => {
        if (data?.length) {
          const {nom, prenom} = data[0];
          // enregistre le nom/prénom
          $crisp.push(['set', 'user:nickname', [`${prenom} ${nom}`]]);
        }
      });

    // enregistre l'email
    $crisp.push(['set', 'user:email', [email]]);
  }
};

// ré-initialise les données de la chatbox (appelée à la déconnexion)
const clearCrispUserData = () => {
  if ('$crisp' in window) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const {$crisp} = window as any;
    $crisp.push(['set', 'user:nickname', [null]]);
    $crisp.push(['set', 'user:email', [null]]);
  }
};

export const authBloc = new AuthBloc();
