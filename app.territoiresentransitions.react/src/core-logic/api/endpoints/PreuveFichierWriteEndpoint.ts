import {supabaseClient} from 'core-logic/api/supabase';
import {ChangeNotifier} from 'core-logic/api/reactivity';
import type {
  PreuveFichierDelete,
  PreuveFichierWrite,
} from 'generated/dataLayer/preuve_fichier_write';

// permet d'ajouter ou supprimer un lien entre une action d'une collectivité et
// un fichier de la bibliothèque de celle-ci
export class PreuveFichierWriteEndpoint extends ChangeNotifier {
  async save(preuve: PreuveFichierWrite): Promise<boolean> {
    const {collectivite_id, action_id, filename, commentaire} = preuve;
    const {error} = await supabaseClient.rpc('upsert_preuve_fichier', {
      collectivite_id,
      action_id,
      filename,
      commentaire,
    });
    if (error) {
      console.error(error);
      return false;
    }
    this.notifyListeners();
    return true;
  }

  async delete(preuve: PreuveFichierDelete): Promise<boolean> {
    const {collectivite_id, action_id, filename} = preuve;
    const {error} = await supabaseClient.rpc('delete_preuve_fichier', {
      collectivite_id,
      action_id,
      filename,
    });
    if (error) {
      console.error(error);
      return false;
    }
    this.notifyListeners();
    return true;
  }
}

export const preuveFichierWriteEndpoint = new PreuveFichierWriteEndpoint();
