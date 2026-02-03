'use client';

import { useSubscribeToUserAuthEvents } from '@tet/api/users/user-context/use-subscribe-to-user-auth-events';
import { UserWithRolesAndPermissions } from '@tet/domain/users';
import { Crisp } from 'crisp-sdk-web';
import { useEffect } from 'react';

const ONE_DAY_IN_SECONDS = 1 * 24 * 60 * 60;

export function CrispWidget({ websiteId }: { websiteId: string }) {
  useEffect(() => {
    Crisp.configure(websiteId, { cookieExpire: ONE_DAY_IN_SECONDS });
  }, [websiteId]);

  useSubscribeToUserAuthEvents({
    onSignIn: identifyCrispUser,
    onSignOut: resetCrispUser,
  });

  return null;
}

const identifyCrispUser = ({
  nom,
  prenom,
  email,
}: UserWithRolesAndPermissions) => {
  if (email) {
    Crisp.user.setEmail(email);
  }

  if (nom && prenom) {
    Crisp.user.setNickname(`${prenom} ${nom}`);
  }
};

const resetCrispUser = () => {
  Crisp.setTokenId();
  Crisp.session.reset();
};
