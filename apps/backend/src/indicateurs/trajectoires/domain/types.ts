import { SourceIndicateur } from '@/backend/indicateurs/trajectoires/domain/source-indicateur';

export type TrajectoirePropertiesType<T extends string = string> = {
  identifiant: string;
  unite: string;
  sources: SourceIndicateur[];
  secteurs: {
    nom: T;
    identifiant: string;
    sousSecteurs?: {
      nom: string;
      identifiant: string;
    }[];
  }[];
};
