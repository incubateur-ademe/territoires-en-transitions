import {makeAutoObservable} from 'mobx';
import {supabaseClient} from 'core-logic/api/supabase';

export class AuthBloc {
  private _userId: string | null = null;
  private _authError: string | null = null;

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
          console.log('user connected ', this.userId);
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
      } else this.setAuthError(response.error.message);
    });
  }

  resetPasswordForEmail({email}: {email: string}) {
    supabaseClient.auth.api
      .resetPasswordForEmail(email)
      .then(response => {
        if (response.error) {
          console.log(response.error?.message);
          this.setAuthError('Email non valide');
        }
      })
      .catch(error => {
        console.log('resetPasswordForEmail error: ', error);
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
}

export const authBloc = new AuthBloc();
