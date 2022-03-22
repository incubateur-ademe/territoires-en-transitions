import {supabaseClient} from 'core-logic/api/supabase';
import {ChangeNotifier} from 'core-logic/api/reactivity';
import type {TReponseWrite} from 'generated/dataLayer/reponse_write';

// Met à jour la réponse d'une collectivité à une question associée
// à une action (personnalisation du référentiel)
export class ReponseWriteEndpoint extends ChangeNotifier {
  async save(reponse: TReponseWrite): Promise<boolean> {
    const {error} = await supabaseClient.rpc('save_reponse', reponse);
    if (error) {
      console.error(error);
      return false;
    }
    this.notifyListeners();
    return true;
  }
}

export const reponseWriteEndpoint = new ReponseWriteEndpoint();
