import { TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { getAuthUser, getTestApp, getTestRouter } from '@/backend/test';
import { AuthenticatedUser } from '@/backend/auth';
import * as fs from 'node:fs';
import path from 'path';

const pathToFormData = async (pathName: string): Promise<FormData> => {
  const filePath = path.resolve(__dirname, pathName);
  const buff = fs.readFileSync(filePath);
  const form = new FormData();
  form.append('file', new Blob([buff], { type: 'application/vnd.ms-excel' }));
  form.append('collectiviteId', '1');
  form.append('planName', 'import test');
  form.append('planType', '1');
  return form;
};

describe('Test import PA', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;

  beforeAll(async () => {
    router = await getTestRouter();
    yoloDodoUser = await getAuthUser();
  });

  test('Test nouveau plan', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const pathName = './resources/Plan_nouveau.xlsx';
    const input = await pathToFormData(pathName);
    const reponse = await caller.plans.fiches.import(input);
    expect(reponse as boolean).toBe(true);
    // TODO reset les données
  });

  test('Test erreur budget', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const pathName = './resources/Plan_erreur_montant.xlsx';
    const input = await pathToFormData(pathName);
    await expect(() => caller.plans.fiches.import(input)).rejects.toThrowError(
      `Erreur(s) rencontrée(s) dans le fichier Excel :
      Ligne 4 : Error: Le montant Entre 200 et 500 est incorrect, les montants ne doivent contenir que des chiffres.

      Merci de la/les corriger avant de retenter un import.`
    );
  });

  test('Test erreur colonne', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const pathName = './resources/Plan_erreur_colonnes.xlsx';
    const input = await pathToFormData(pathName);
    await expect(() => caller.plans.fiches.import(input)).rejects.toThrowError(`Erreur rencontrée dans le fichier Excel :
          La colonne U devrait être "Financeur 1" et non "Budget prévisionnel total € TTC"
          Les colonnes attendues sont : Axe (x),Sous-axe (x.x),Sous-sous axe (x.x.x),Titre de la fiche action,Descriptif,Thématique principale,Sous-thématiques,Instances de gouvernance,Objectifs,Indicateurs liés,Résultats attendus,Cibles,Structure pilote,Moyens humains et techniques,Partenaires,Service-département-pôle pilote,Personne pilote,Élu·e référent·e,Participation Citoyenne,Financements,Financeur 1,Montant € TTC,Financeur 2,Montant € TTC,Financeur 3,Montant € TTC,Budget prévisionnel total € TTC,Statut,Niveau de priorité,Date de début,Date de fin,Action en amélioration continue,Calendrier,Actions liées,Fiches des plans liées,Notes de suivi,Etapes de la fiche action,Notes complémentaires,Documents et liens
          Les colonnes données sont   : Axe (x),Sous-axe (x.x), Sous-sous axe (x.x.x),Titre de la fiche action,Descriptif,Thématique principale,Sous-thématiques,Instances de gouvernance,Objectifs,Indicateurs liés,Résultats attendus,Cibles,Structure pilote,Moyens humains et techniques,Partenaires ,Service-département-pôle pilote,Personne pilote,Élu·e référent·e ,Participation Citoyenne,Financements,Budget prévisionnel total € TTC,Financeur 1,Montant € TTC,Financeur 2,Montant € TTC,Financeur 3,Montant € TTC,Statut ,Niveau de priorité,Date de début,Date de fin,Action en amélioration continue,Calendrier,Actions liées,Fiches des plans liées,Notes de suivi,Etapes de la fiche action,Notes complémentaires,Documents et liens

          Merci de la corriger avant de retenter un import.`);
  });
});
