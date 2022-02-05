import {
  CurrentCollectiviteObserved,
  CurrentCollectiviteBloc,
} from 'core-logic/observables';
import {supabaseClient} from 'core-logic/api/supabase';
import {
  collectivite1,
  yoloCredentials,
  yuluCredentials,
} from 'test_utils/collectivites';

describe('CollectiviteBloc', () => {
  it('should change to Collectivite given id when connected user is referent, so editable', async () => {
    const currentCollectiviteBloc = new CurrentCollectiviteBloc();
    await supabaseClient.auth.signIn(yoloCredentials);

    await currentCollectiviteBloc.update({collectiviteId: 1});
    const expectedObserved: CurrentCollectiviteObserved = {
      ...collectivite1,
      role_name: 'referent',
    };
    expect(currentCollectiviteBloc.currentCollectivite).toEqual(
      expectedObserved
    );
  });
  it('should change to Collectivite given id when connected user does not belong to Collectivite, so not editable', async () => {
    const currentCollectiviteBloc = new CurrentCollectiviteBloc();
    await supabaseClient.auth.signIn(yuluCredentials);

    await currentCollectiviteBloc.update({collectiviteId: 1});

    const expectedObserved: CurrentCollectiviteObserved = {
      ...collectivite1,
      role_name: null,
    };
    expect(currentCollectiviteBloc.currentCollectivite).toEqual(
      expectedObserved
    );
  });
});
