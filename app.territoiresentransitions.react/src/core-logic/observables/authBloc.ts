import {makeAutoObservable} from 'mobx';
import {supabaseClient} from 'core-logic/api/supabase';

export class AuthBloc {
  private _userId: string | null = null;
  private _authError: string | null = null;

  constructor() {
    makeAutoObservable(this);
    const connectedUser = supabaseClient.auth.user();
    if (connectedUser) {
      this._userId = connectedUser.id;
    }
  }

  connect({email, password}: {email: string; password: string}) {
    supabaseClient.auth
      .signIn({email, password})
      .then(session => {
        if (session.user) {
          this._userId = session.user.id;
          this._authError = null;
          console.log('user connected ', this.userId);
        } else {
          console.log(session.error?.message);
          this._authError = "L'email et le mot de passe ne correspondent pas.";
          this._userId = null;
        }
      })
      .catch(error => {
        console.log('Connection error: ', error);
      });
  }

  disconnect() {
    supabaseClient.auth.signOut().then(response => {
      if (response.error === null) {
        this._userId = null;
      } else this._authError = response.error.message;
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
}

export const authBloc = new AuthBloc();
