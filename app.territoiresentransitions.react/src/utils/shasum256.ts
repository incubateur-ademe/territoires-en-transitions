/**
 * Calcule la somme de contrôle (SHA-256) d'un fichier
 *
 * équivalent au résultat de la commande unix : `shasum -a 256 <file>`
 */

export const shasum256 = async (file: File): Promise<string> => {
  // calcule un hash du contenu du fichier (renvoi un buffer)
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  // transforme le buffer en tableau puis en chaine hexadécimale
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};
