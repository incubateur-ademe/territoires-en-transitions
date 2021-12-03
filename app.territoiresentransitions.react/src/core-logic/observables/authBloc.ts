import {makeAutoObservable} from 'mobx';
import {supabase} from 'core-logic/api/supabase';

export class AuthBloc {
  private userId?: string;
  private _connected = false;
  private _authError?: string;

  constructor() {
    makeAutoObservable(this);
  }

  connect({email, password}: {email: string; password: string}) {
    supabase.auth
      .signIn({email, password})
      .then(session => {
        if (session.user) {
          this._connected = true;
          this.userId = session.user.id;
          this._authError = undefined;
          console.log('user connected ', session.user);
        } else {
          console.log(session.error?.message);
          this._authError = "L'email et le mot de passe ne correspondent pas.";
        }
      })
      .catch(error => {
        console.log('Connection error: ', error);
      });
  }

  disconnect() {
    supabase.auth.signOut().then(response => {
      if (response.error === null) this._connected = false;
      else this._authError = response.error.message;
    });
  }

  get connected() {
    return this._connected;
  }
  get authError() {
    return this._authError;
  }
}

export const authBloc = new AuthBloc();
