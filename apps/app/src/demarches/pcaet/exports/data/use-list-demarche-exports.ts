'use client';

import { useQuery } from '@tanstack/react-query';
import { RouterInput, RouterOutput, useTRPC } from '@tet/api';

export type DemarcheExportsRef =
  RouterInput['demarches']['pcaet']['exports']['list'];
export type DemarcheExports =
  RouterOutput['demarches']['pcaet']['exports']['list'];
export type DemarcheExportType = keyof DemarcheExports;
export type DemarcheExportEntry = NonNullable<
  DemarcheExports[DemarcheExportType]
>;

/**
 * Les classeurs proposés au téléchargement pour un dépôt. Les étapes plan et
 * diagnostic lisent la même requête : passer de l'une à l'autre ne relance pas
 * d'appel.
 */
export const useListDemarcheExports = (dossierRef: DemarcheExportsRef) => {
  const trpc = useTRPC();
  return useQuery(trpc.demarches.pcaet.exports.list.queryOptions(dossierRef));
};
