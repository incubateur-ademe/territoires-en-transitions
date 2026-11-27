/** La ligne de commande. */

/** La valeur qui suit une option de la ligne de commande ; erreur si elle manque. */
export const getArgument = (nom: string) => {
  const valeur = process.argv[process.argv.indexOf(nom) + 1];
  if (!process.argv.includes(nom) || !valeur) {
    throw new Error(`${nom} est requis.`);
  }
  return valeur;
};

/** La date de référence (AAAA-MM-JJ) : le jour de l'import, pas la date de gel de T&C. */
export const getDateReference = () => {
  const date = getArgument('--date-reference');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(
      `--date-reference attend une date AAAA-MM-JJ, pas « ${date} ».`
    );
  }
  return date;
};
