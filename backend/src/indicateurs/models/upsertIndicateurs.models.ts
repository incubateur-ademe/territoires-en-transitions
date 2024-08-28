import { CreateIndicateurValeurType } from './indicateur.models';

export type UpsertIndicateursValeursRequest = {
  valeurs: CreateIndicateurValeurType[];
};

export type UpsertIndicateursValeursResponse = UpsertIndicateursValeursRequest;
