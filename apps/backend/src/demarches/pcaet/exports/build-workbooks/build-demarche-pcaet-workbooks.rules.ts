import type { PcaetDiagnostic } from '@tet/domain/demarches';

/**
 * Le diagnostic a-t-il de quoi remplir un classeur ? Au moins une valeur
 * d'indicateur ou une ligne de vulnérabilité renseignée. Chaque thématique a
 * sa ligne, même vierge : la présence d'une ligne ne dit rien.
 */
export const hasPcaetDiagnosticData = (diagnostic: PcaetDiagnostic): boolean =>
  diagnostic.indicateurValeurs.some(
    ({ indicateurValeur }) =>
      indicateurValeur.resultat !== null || indicateurValeur.objectif !== null
  ) ||
  diagnostic.vulnerabilite.lignes.some(
    (ligne) =>
      ligne.niveauMaintenant !== null ||
      ligne.niveau2050 !== null ||
      ligne.niveau2100 !== null ||
      Boolean(ligne.objectifs2050?.trim()) ||
      Boolean(ligne.objectifs2100?.trim())
  );
