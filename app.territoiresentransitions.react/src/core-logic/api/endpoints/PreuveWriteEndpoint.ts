import {supabaseClient} from 'core-logic/api/supabase';
import {ChangeNotifier} from 'core-logic/api/reactivity';
import type {PreuveWrite} from 'generated/dataLayer/preuve_write';

export class PreuveWriteEndpoint extends ChangeNotifier {
  async save(preuve: PreuveWrite): Promise<boolean> {
    const {collectivite_id, action_id, filename, commentaire} = preuve;
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

export const preuveWriteEndpoint = new PreuveWriteEndpoint();
