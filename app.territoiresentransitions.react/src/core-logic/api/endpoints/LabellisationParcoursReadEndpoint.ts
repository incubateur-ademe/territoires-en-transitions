import {supabaseClient} from 'core-logic/api/supabase';
import {ChangeNotifier} from 'core-logic/api/reactivity';
import {LabellisationParcoursRead} from 'generated/dataLayer/labellisation_parcours_read';

export interface LabellisationGetParams {
  collectivite_id: number;
}

export class LabellisationParcoursReadEndpoint extends ChangeNotifier {
  getBy = async ({
    collectivite_id,
  }: LabellisationGetParams): Promise<LabellisationParcoursRead[]> => {
    const {data, error} = await supabaseClient.rpc('labellisation_parcours', {
      collectivite_id,
    });

    if (error || !data) {
      return [];
    }
    return data as LabellisationParcoursRead[];
  };
}

export const labellisationParcoursReadEndpoint =
  new LabellisationParcoursReadEndpoint();
