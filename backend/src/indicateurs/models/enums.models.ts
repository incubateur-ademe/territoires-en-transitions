/**
 * - <b>commune_non_supportee</b> : La collectivité est une commune, seulement les epci sont supportés
 * - <b>deja_calcule</b> : La collectivité a déjà des données trajectoire SNBC calculées
 * - <b>pret_a_calculer</b> : La collectivité a les données disponibles pour lancer le calcul
 * - <b>donnees_manquantes</b> La collectivité n'a pas les données disponibles pour lancer le calcul
 */
export enum CheckDataSNBCStatus {
  COMMUNE_NON_SUPPORTEE = 'commune_non_supportee',
  DEJA_CALCULE = 'deja_calcule',
  PRET_A_CALCULER = 'pret_a_calculer',
  DONNEES_MANQUANTES = 'donnees_manquantes',
}
