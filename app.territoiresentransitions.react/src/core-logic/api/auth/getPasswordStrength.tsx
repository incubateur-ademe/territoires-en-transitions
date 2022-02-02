import {zxcvbn, ZxcvbnOptions, ZxcvbnResult} from '@zxcvbn-ts/core';
import zxcvbnCommonPackage from '@zxcvbn-ts/language-common';
import zxcvbnFrPackage from '@zxcvbn-ts/language-fr';

// certains mots spécifiques du site qui vont faire baisser le score du mdp
const UNSAFE_WORDS = ['ademe', 'tet', 'territoire', 'transition'];

// options pour le calcul de robustesse
const options = {
  // les traductions des messages d'aide
  translations: zxcvbnFrPackage.translations,
  // les dispositions de clavier standard
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  // les dictionnaires de noms communs
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnFrPackage.dictionary,
  },
};
ZxcvbnOptions.setOptions(options);

/**
 * Détermine un score de robustesse du mot de passe
 */
export const getPasswordStrength = (
  /** mot de passe */
  password: string,
  /** autres valeurs à éviter dans le mdp */
  otherValues: string[]
): ZxcvbnResult => {
  // les autres valeurs du formulaire sont également prises en compte dans le score
  const userInputs = [...otherValues, ...UNSAFE_WORDS];
  return zxcvbn(password, userInputs) as ZxcvbnResult;
};
