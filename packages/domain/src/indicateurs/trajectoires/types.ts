import { IndicateurSourceEnum } from './indicateur-source.enum';

export type TrajectoirePropertiesType<T extends string = string> = {
  identifiant: string;
  unite: string;
  sources: IndicateurSourceEnum[];
  secteurs: {
    nom: T;
    identifiant: string;
    sousSecteurs?: {
      nom: string;
      identifiant: string;
    }[];
  }[];
};
