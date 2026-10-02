/** Le rapport : les saisines écrites, par type de service et par périmètre, et les dossiers auxquels un type de service manque. */

import { PcaetPerimetreSaisineEnum } from '@tet/domain/demarches';
import { decrireDossier, type Dossier } from './dossiers';
import type { Saisine } from './services';

/**
 * Affiche les saisines par type de service, puis les dossiers sans saisine principale d'un type.
 * Seuls nommés, ces manques sont attendus : l'outre-mer, Paris et la petite couronne n'ont pas de DDT.
 */
export const printRapport = ({
  dossiers,
  saisines,
  ecrites,
  isConfirmed,
}: {
  dossiers: readonly Dossier[];
  saisines: readonly Saisine[];
  ecrites: number;
  isConfirmed: boolean;
}) => {
  console.log(`${dossiers.length} dossiers repris transmis pour avis`);
  console.log(`${ecrites} saisines écrites`);

  const types = [...new Set(saisines.map((s) => s.type))].sort();
  for (const type of types) {
    const duType = saisines.filter((s) => s.type === type);
    const principales = duType.filter(estPrincipale).length;
    console.log(
      `  ${type} : ${duType.length} (${principales} principales, ${
        duType.length - principales
      } secondaires)`
    );
  }

  for (const type of types) {
    const sansCeType = dossiers.filter(
      (d) =>
        !saisines.some(
          (s) =>
            s.dossier.demarcheId === d.demarcheId &&
            s.type === type &&
            estPrincipale(s)
        )
    );
    if (sansCeType.length > 0) {
      console.log(`\nDossiers sans ${type} principal : ${sansCeType.length}`);
      for (const d of sansCeType) {
        console.log(`  ${decrireDossier(d)}`);
      }
    }
  }

  console.log(
    isConfirmed
      ? '\nImport terminé.'
      : '\nSimulation : tout a été annulé. Relancer avec --confirm pour importer.'
  );
};

const estPrincipale = (s: Saisine) =>
  s.perimetre === PcaetPerimetreSaisineEnum.PRINCIPAL;
