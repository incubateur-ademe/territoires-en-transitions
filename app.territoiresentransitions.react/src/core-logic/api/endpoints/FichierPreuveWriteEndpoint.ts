import {supabaseClient} from 'core-logic/api/supabase';
import {ChangeNotifier} from 'core-logic/api/reactivity';
import type {FichierPreuveWrite} from 'generated/dataLayer/fichier_preuve_write';

export class FichierPreuveWriteEndpoint extends ChangeNotifier {
  async save(fichierPreuve: FichierPreuveWrite): Promise<boolean> {
    const {collectivite_id, action_id, filename, commentaire} = fichierPreuve;
    const {error} = await supabaseClient.rpc('upsert_preuve', {
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
}

export const fichierPreuveWriteEndpoint = new FichierPreuveWriteEndpoint();
