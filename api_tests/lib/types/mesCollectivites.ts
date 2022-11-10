import { NiveauAcces } from "./niveauAcces.ts";

export type MesCollectivites = {
  collectivite_id: number;
  nom: string;
  niveau_acces: NiveauAcces;
  est_auditeur: boolean;
};
