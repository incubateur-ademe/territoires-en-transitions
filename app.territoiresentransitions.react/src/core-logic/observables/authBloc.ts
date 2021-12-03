import {makeAutoObservable} from 'mobx';
import {supabase} from 'core-logic/api/supabase';

export class AuthBloc {
  private _userId: string | null = null;
  private _connected = false;
  private _authError: string | null = null;

  constructor() {
    makeAutoObservable(this);
    const connectedUser = supabase.auth.user();
    if (connectedUser) {
      this._connected = true;
      this._userId = connectedUser.id;
    }
  }

  connect({email, password}: {email: string; password: string}) {
    supabase.auth
      .signIn({email, password})
      .then(session => {
        if (session.user) {
          this._connected = true;
          this._userId = session.user.id;
          this._authError = null;
          console.log('user connected ', session.user);
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
  get userId() {
    return this._userId;
  }
}

export const authBloc = new AuthBloc();
