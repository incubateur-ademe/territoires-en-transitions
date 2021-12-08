import {
  CurrentCollectiviteObserved,
  CurrentCollectiviteBloc,
} from 'core-logic/observables';
import {supabase} from 'core-logic/api/supabase';
import {collectivite1} from 'test_utils/collectivites';

describe('CollectiviteBloc', () => {
  it('should change to Collectivite given id when connected user is referent, so editable', () => {
    const currentCollectiviteBloc = new CurrentCollectiviteBloc();

    supabase.auth.signIn({email: 'yolo@dodo.com', password: 'yolododo'});
    currentCollectiviteBloc.update({collectiviteId: 1});
    const expectedObserved: CurrentCollectiviteObserved = {
      ...collectivite1,
      role_name: 'referent',
    };
    expect(currentCollectiviteBloc.currentCollectivite).toBe(expectedObserved);
  });
  it('should change to Collectivite given id when connected user does not belong to Collectivite, so not editable', () => {
    const currentCollectiviteBloc = new CurrentCollectiviteBloc();

    supabase.auth.signIn({email: 'yulu@dudu.com', password: 'yulududu'});
    currentCollectiviteBloc.update({collectiviteId: 1});
    const expectedObserved: CurrentCollectiviteObserved = {
      ...collectivite1,
      role_name: null,
    };
    expect(currentCollectiviteBloc.currentCollectivite).toBe(expectedObserved);
  });
});
