import React from 'react';

import {MonCompte} from './MonCompte';
import {fakeUserData} from '../../../../fixtures/userData';

export default {
  component: MonCompte,
};

export const Defaut = () => <MonCompte user={fakeUserData} />;
