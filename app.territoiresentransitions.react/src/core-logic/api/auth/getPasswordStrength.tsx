import zxcvbn from 'zxcvbn';

// certains mots spécifiques du site qui vont faire baisser le score du mdp
const UNSAFE_WORDS = ['ademe', 'tet', 'territoire', 'transition'];

/**
 * Détermine un score de robustesse du mot de passe
 */
export const getPasswordStrength = (
  /** mot de passe */
  password: string,
  /** autres valeurs à éviter dans le mdp */
  otherValues: string[]
): number => {
  // les autres valeurs du formulaire sont également prises en compte dans le score
  const userInputs = [...otherValues, ...UNSAFE_WORDS];
  return zxcvbn(password, userInputs).score;
};
