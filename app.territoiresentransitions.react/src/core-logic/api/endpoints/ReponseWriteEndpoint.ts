import {supabaseClient} from 'core-logic/api/supabase';
import {ChangeNotifier} from 'core-logic/api/reactivity';
import type {
  TReponseWrite,
  TQuestionReponseWrite,
} from 'generated/dataLayer/reponse_write';

// Met à jour la réponse d'une collectivité à une question associée
// à une action (personnalisation du référentiel)
export class ReponseWriteEndpoint extends ChangeNotifier {
  async save(qr: TQuestionReponseWrite): Promise<boolean> {
    const newReponse = transform(qr);
    const ret = await supabaseClient.rpc('save_reponse', newReponse);
    if (ret?.error) {
      throw ret?.error;
    }
    this.notifyListeners();
    return true;
  }
}

// transforme en proportion un pourcentage
const transform = (qr: TQuestionReponseWrite): TReponseWrite => {
  const {collectivite_id, question, reponse} = qr;
  const newReponse = {collectivite_id, question_id: question.id};
  return question.type === 'proportion' && typeof reponse === 'number'
    ? {...newReponse, reponse: reponse / 100}
    : {...newReponse, reponse};
};

export const reponseWriteEndpoint = new ReponseWriteEndpoint();
