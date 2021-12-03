import {AuthBloc} from 'core-logic/observables';
import {when} from 'mobx';

describe('authBloc', () => {
  it('should connect if correct (email, password) are given', async () => {
    const authBloc = new AuthBloc();
    authBloc.connect({email: 'yolo@dodo.com', password: 'yolododo'});
    await when(() => authBloc.connected);

    expect(authBloc.connected).toBe(true);
    expect(authBloc.authError).not.toBeDefined();
  });
  it('should message error if incorrect password is given) ', async () => {
    const authBloc = new AuthBloc();
    authBloc.connect({email: 'yolo@dodo.com', password: 'wrongpassword'});

    await when(() => !!authBloc.authError);

    expect(authBloc.connected).toBe(false);
    expect(authBloc.authError).toBe(
      "L'email et le mot de passe ne correspondent pas."
    );
  });
  it('should message error if unknown email is given ', async () => {
    const authBloc = new AuthBloc();
    authBloc.connect({email: 'unkownuser@gmail.com', password: 'password'});
    await when(() => !!authBloc.authError);

    expect(authBloc.connected).toBe(false);
    expect(authBloc.authError).toBe(
      "L'email et le mot de passe ne correspondent pas."
    );
  });
});
