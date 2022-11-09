import { Avancement } from "./avancement.ts";

export type ActionStatut = {
  action_id: string;
  avancement: Avancement;
  avancement_detaille?: number[];
  concerne: boolean;
  collectivite_id: number;
};
