import {CurrentEpciBloc, CurrentEpciObserved} from 'core-logic/observables';
import {supabase} from 'core-logic/api/supabase';

describe('epciBloc', () => {
  it('should change to epci given siren when connected user is referent, so editable', () => {
    const currentEpciBloc = new CurrentEpciBloc();

    supabase.auth.signIn({email: 'yolo@dodo.com', password: 'yolododo'});
    currentEpciBloc.change({siren: '200042935'});
    const expectedObserved: CurrentEpciObserved = {
      nom: 'Haut - Bugey Agglomération',
      siren: '200042935',
      role_name: 'referent',
    };
    expect(currentEpciBloc.currentEpci).toBe(expectedObserved);
  });
  it('should change to epci given siren when connected user does not belong to EPCI, so not editable', () => {
    const currentEpciBloc = new CurrentEpciBloc();

    supabase.auth.signIn({email: 'yulu@dudu.com', password: 'yulududu'});
    currentEpciBloc.change({siren: '200042935'});
    const expectedObserved: CurrentEpciObserved = {
      nom: 'Haut - Bugey Agglomération',
      siren: '200042935',
    };
    expect(currentEpciBloc.currentEpci).toBe(expectedObserved);
  });
});
