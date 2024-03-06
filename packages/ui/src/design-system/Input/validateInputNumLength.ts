const RE_CLEAN = /[^\d]/g; // pour supprimer les caractères non numériques

// nettoie une saisie numérique et renvoie la valeur saisie non formattée si elle est valide
export const validateInputNumLength = (
  value: string,
  expectedLength: number
) => {
  // nettoie le code saisi
  const v = value.replace(RE_CLEAN, '');
  // et le renvoi si la longueur est celle attendue
  return v.length === expectedLength ? v : false;
};
