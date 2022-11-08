type credentials = {
  email: string;
  password: string;
};

/**
 * Génère l'email et le mot de passe pour les utilisateurs de test.
 *
 * @param nickname ex 'yolododo', 'youloudou'
 */
export function fakeCredentials(nickname: string): credentials {
  const match = nickname.toLowerCase().match(/(y.+l.+)(d.+d.+)/)!;
  const firstName = match[1];
  const lastName = match[2];

  return {
    email: `${firstName}@${lastName}.com`,
    password: `${firstName}${lastName}`,
  };
}
