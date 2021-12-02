import {makeAutoObservable} from 'mobx';
import {supabase} from 'core-logic/api/supabase';

class AuthBloc {
  private userId?: string;
  private _connected = false;
  private authError?: string;

  constructor() {
    makeAutoObservable(this);
  }

  connect({email, password}: {email: string; password: string}) {
    supabase.auth.signIn({email, password}).then(session => {
      if (session.user) {
        this._connected = true;
        this.userId = session.user.id;
        this.authError = undefined;
        console.log('user connected ', session.user);
      } else {
        this.authError = session.error?.message;
        console.log('connection error : ', this.authError);
      }
    });
  }

  disconnect() {
    supabase.auth.signOut().then(response => {
      if (response.error === null) this._connected = false;
      else this.authError = response.error.message;
    });
  }

  get connected() {
    return this._connected;
  }
}

export const authBloc = new AuthBloc();
