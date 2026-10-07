import { join } from 'path';

/**
 * Le fichier BANATIC de composition communale des EPCI à fiscalité propre, et
 * les deux façons d'y accéder.
 *
 * Deux imports s'en servent — les relations EPCI ↔ communes et les périmètres
 * géographiques secondaires — et il n'y a aucune raison qu'ils divergent sur la
 * source.
 */

/**
 * Identifiant **pérenne** de la ressource `perimetre-epci-a-fp.csv` du jeu de
 * données data.gouv « base nationale sur les intercommunalités » (DGCL).
 *
 * data.gouv répond par une redirection vers l'URL horodatée du millésime
 * courant : un rejeu ramène le fichier de l'année sans qu'on touche à cette
 * constante.
 */
export const EPCI_PERIMETRE_DATAGOUV_URL =
  'https://www.data.gouv.fr/api/1/datasets/r/6e05c448-62cc-4470-aa0f-4f31adea0bc4';

/**
 * Le même fichier, committé à côté de ce module et copié dans `dist` par
 * `nest-cli.json`. Il sert de repli quand le réseau manque, et de source aux
 * tests, qui ne doivent dépendre de personne.
 */
export const epciPerimetreCsvPath = (): string =>
  join(__dirname, 'perimetre-epci-a-fp.csv');
