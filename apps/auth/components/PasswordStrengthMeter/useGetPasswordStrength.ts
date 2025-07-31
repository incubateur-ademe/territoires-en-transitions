'use client';

import {zxcvbn, zxcvbnOptions} from '@zxcvbn-ts/core';
import {useEffect} from 'react';

// certains mots spécifiques du site qui vont faire baisser le score du mdp
const UNSAFE_WORDS = ['ademe', 'tet', 'territoire', 'transition'];

/**
 * Charge les options et expose la fonction permettant de contrôler la
 * robustesse des mots de passe.
 */
export const useGetPasswordStrength = () => {
  useEffect(() => {
    loadOptions();
  }, []);

  return getPasswordStrength;
};

/**
 * Charge de manière asynchrone les options de la bibliothèque de contrôle de
 * robustesse des mots de passe.
 */
const loadOptions = async () => {
  const zxcvbnCommonPackage = await import('@zxcvbn-ts/language-common');
  const zxcvbnFrPackage = await import('@zxcvbn-ts/language-fr');

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
    // recommended
    useLevenshteinDistance: true,
  };
  zxcvbnOptions.setOptions(options);
};

/**
 * Détermine la robustesse du mot de passe
 */
const getPasswordStrength = (
  /** mot de passe */
  password: string,
  /** autres valeurs à éviter dans le mdp */
  otherValues: string[]
) => {
  if (!password) return null;
  // pour éviter les mdp trop faciles à deviner les autres valeurs du formulaire
  // (comme l'email) doivent également être prises en compte
  const userInputs = [...otherValues, ...UNSAFE_WORDS];
  return zxcvbn(password, userInputs);
};
