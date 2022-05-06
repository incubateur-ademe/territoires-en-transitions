import {supabaseClient} from 'core-logic/api/supabase';
import {ChangeNotifier} from 'core-logic/api/reactivity';
import type {
  LabellisationPreuveFichierDelete,
  LabellisationPreuveFichierWrite,
} from 'generated/dataLayer/labellisation_preuve_fichier_write';

// permet d'ajouter ou supprimer un lien entre une demande de labellisation
// d'une collectivité et un fichier de la bibliothèque de celle-ci
export class LabellisationFichierWriteEndpoint extends ChangeNotifier {
  async save(preuve: LabellisationPreuveFichierWrite): Promise<boolean> {
    const {collectivite_id, demande_id, filename, commentaire} = preuve;
    const {error} = await supabaseClient.rpc(
      'upsert_labellisation_preuve_fichier',
      {
        collectivite_id,
        demande_id,
        filename,
        commentaire,
      }
    );
    if (error) {
      return false;
    }
    this.notifyListeners();
    return true;
  }

  async delete(preuve: LabellisationPreuveFichierDelete): Promise<boolean> {
    const {collectivite_id, demande_id, filename} = preuve;
    const {error} = await supabaseClient.rpc('delete_preuve_fichier', {
      collectivite_id,
      demande_id,
      filename,
    });
    if (error) {
      return false;
    }
    this.notifyListeners();
    return true;
  }
}

export const labellisationFichierWriteEndpoint =
  new LabellisationFichierWriteEndpoint();
