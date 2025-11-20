import { getAuthUser, getTestApp, getTestRouter } from '@tet/backend/test';
import { RoleUpdateService } from '@tet/backend/users/authorizations/roles/role-update.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { AppRouter, TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { inferProcedureInput } from '@trpc/server';
import * as fs from 'node:fs';
import path from 'path';

type inputType = inferProcedureInput<AppRouter['plans']['fiches']['import']>;

const pathToInput = async (pathName: string): Promise<inputType> => {
  const filePath = path.resolve(__dirname, pathName);
  const buff = fs.readFileSync(filePath);
  return {
    collectiviteId: 1,
    planName: 'import test',
    planType: 1,
    file: buff.toString('base64'),
  };
};

describe('Test import PA', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let roleUpdateService: RoleUpdateService;

  beforeAll(async () => {
    router = await getTestRouter();
    yoloDodoUser = await getAuthUser();
    const app = await getTestApp();
    roleUpdateService = app.get(RoleUpdateService);
  });

  test('Test utilisateur non support', async () => {
    await roleUpdateService.setIsSupport(yoloDodoUser.id, false);
    const caller = router.createCaller({ user: yoloDodoUser });
    const pathName = './resources/Plan_nouveau.xlsx';
    const input = await pathToInput(pathName);
    await expect(() =>
      caller.plans.fiches.import(input)
    ).rejects.toThrowError();
  });

  test('Test nouveau plan', async () => {
    await roleUpdateService.setIsSupport(yoloDodoUser.id, true);
    // TODO reset les données créés lors de l'import (plans, fiches, tags)
    onTestFinished(async () => {
      try {
        await roleUpdateService.setIsSupport(yoloDodoUser.id, false);
      } catch (error) {
        console.error('Erreur lors de la remise à zéro des données.', error);
      }
    });
  });

  test('Test erreur budget', async () => {
    await roleUpdateService.setIsSupport(yoloDodoUser.id, true);
    const caller = router.createCaller({ user: yoloDodoUser });
    const pathName = './resources/Plan_erreur_montant.xlsx';
    const input = await pathToInput(pathName);
    await expect(() => caller.plans.fiches.import(input)).rejects.toThrowError(
      `<strong>Erreur(s) rencontrée(s) dans le fichier Excel :</strong></br>
      <ul>
      <li><strong>Ligne 4 :</strong> Error: Le montant "<em>Entre 200 et 500</em>" est incorrect, les montants ne doivent contenir que des chiffres.</li>
      </ul>
      <br><br>
      Merci de la/les corriger avant de retenter un import.`
    );
    onTestFinished(async () => {
      try {
        await roleUpdateService.setIsSupport(yoloDodoUser.id, false);
      } catch (error) {
        console.error('Erreur lors de la remise à zéro des données.', error);
      }
    });
  });

  test('Test erreur colonne', async () => {
    await roleUpdateService.setIsSupport(yoloDodoUser.id, true);
    const caller = router.createCaller({ user: yoloDodoUser });
    const pathName = './resources/Plan_erreur_colonnes.xlsx';
    const input = await pathToInput(pathName);
    await expect(() => caller.plans.fiches.import(input)).rejects
      .toThrowError(`<strong>Erreur rencontrée dans le fichier Excel :</strong><br>
          La colonne <em>Q</em> devrait être "<strong>Financeur 1</strong>" et non "<strong>Budget prévisionnel total € HT</strong>"<br><br>
          <strong>Les colonnes attendues sont :</strong> <pre>Axe (x),Sous-axe (x.x),Sous-sous axe (x.x.x),Titre de la fiche action,Descriptif,Instances de gouvernance,Objectifs,Indicateurs liés,Structure pilote,Moyens humains et techniques,Partenaires,Direction ou service pilote,Personne pilote,Élu·e référent·e,Participation Citoyenne,Financements,Financeur 1,Montant € HT,Financeur 2,Montant € HT,Financeur 3,Montant € HT,Budget prévisionnel total € HT,Statut,Niveau de priorité,Date de début,Date de fin,Action en amélioration continue,Calendrier,Actions liées,Fiches des plans liées,Notes de suivi,Etapes de la fiche action,Notes complémentaires,Documents et liens</pre><br>
          <strong>Les colonnes données sont   :</strong> <pre>Axe (x),Sous-axe (x.x), Sous-sous axe (x.x.x),Titre de la fiche action,Descriptif,Instances de gouvernance,Objectifs,Indicateurs liés,Structure pilote,Moyens humains et techniques,Partenaires ,Direction ou service pilote,Personne pilote,Élu·e référent·e ,Participation Citoyenne,Financements,Budget prévisionnel total € HT,Financeur 1,Montant € HT,Financeur 2,Montant € HT,Financeur 3,Montant € HT,Statut ,Niveau de priorité,Date de début,Date de fin,Action en amélioration continue,Calendrier,Actions liées,Fiches des plans liées,Notes de suivi,Etapes de la fiche action,Notes complémentaires,Documents et liens</pre><br><br>

          Merci de la corriger avant de retenter un import.`);
    onTestFinished(async () => {
      try {
        await roleUpdateService.setIsSupport(yoloDodoUser.id, false);
      } catch (error) {
        console.error('Erreur lors de la remise à zéro des données.', error);
      }
    });
  });
});
