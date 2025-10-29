'use client';

import { useSubscribeToUserAuthEvents } from '@/api/users/user-context/use-subscribe-to-user-auth-events';
import { UserWithCollectiviteAccesses } from '@/domain/users';
import { Crisp } from 'crisp-sdk-web';
import { useEffect } from 'react';

export function CrispWidget({ websiteId }: { websiteId: string }) {
  useEffect(() => {
    Crisp.configure(websiteId);
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
}: UserWithCollectiviteAccesses) => {
  if (nom && prenom) {
    Crisp.user.setNickname(`${prenom} ${nom}`);
  }

  if (email) {
    Crisp.user.setEmail(email);
  }
};

const resetCrispUser = () => {
  Crisp.session.reset();
};
