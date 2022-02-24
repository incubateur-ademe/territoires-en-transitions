import {PreuveFichierRead} from '../preuve_fichier_read';
import {PreuveLienRead} from '../preuve_lien_read';

export interface PreuveParams {
  collectivite_id: number;
  action_id: string;
}

export type PreuveRead = PreuveLienRead | PreuveFichierRead;
