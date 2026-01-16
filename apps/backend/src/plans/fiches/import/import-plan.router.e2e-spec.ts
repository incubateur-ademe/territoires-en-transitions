import { INestApplication } from '@nestjs/common';
import { getAuthUser, getTestApp, getTestRouter } from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { addAndEnableUserSuperAdminMode } from '@tet/backend/users/users/users.test-fixture';
import { AppRouter, TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { inferProcedureInput } from '@trpc/server';
import * as fs from 'node:fs';
import path from 'path';

type inputType = inferProcedureInput<AppRouter['plans']['fiches']['import']>;

const pathToInput = async ({
  pathName,
  collectiviteId = 1,
}: {
  pathName: string;
  collectiviteId?: number;
}): Promise<inputType> => {
  const filePath = path.resolve(__dirname, pathName);
  const buff = fs.readFileSync(filePath);
  return {
    collectiviteId,
    planName: 'import test',
    planType: 1,
    file: buff.toString('base64'),
  };
};

describe('Test import PA', () => {
  let router: TrpcRouter;
  let yoloDodoUser: AuthenticatedUser;
  let app: INestApplication;

  beforeAll(async () => {
    router = await getTestRouter();
    yoloDodoUser = await getAuthUser();
    app = await getTestApp();
  });

  test('Test utilisateur non support', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });
    const pathName = './resources/nouveau-plan-valide.xlsx';
    const input = await pathToInput({ pathName, collectiviteId: 1 });
    await expect(() =>
      caller.plans.fiches.import(input)
    ).rejects.toThrowError();
  });

  test('Utilisateur support même sans droits sur la collectivité doit pouvoir importer le plan', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: yoloDodoUser.id,
    });

    onTestFinished(cleanup);

    const pathName = './resources/nouveau-plan-valide.xlsx';
    const input = await pathToInput({ pathName, collectiviteId: 50 });

    const result = await caller.plans.fiches.import(input);
    expect(result).toBe(true);
  });

  test('Test erreur budget', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: yoloDodoUser.id,
    });

    onTestFinished(cleanup);

    const pathName = './resources/Plan_erreur_montant.xlsx';
    const input = await pathToInput({ pathName });
    await expect(() => caller.plans.fiches.import(input)).rejects.toThrowError(
      `<strong>Erreur(s) rencontrée(s) dans le fichier Excel :</strong></br>
      <ul>
      <li><strong>Ligne 4 :</strong> Error: Le montant "<em>Entre 200 et 500</em>" est incorrect, les montants ne doivent contenir que des chiffres.</li>
      </ul>
      <br><br>
      Merci de la/les corriger avant de retenter un import.`
    );
  });

  test('Test erreur colonne', async () => {
    const caller = router.createCaller({ user: yoloDodoUser });

    const { cleanup } = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: yoloDodoUser.id,
    });

    onTestFinished(cleanup);

    const pathName = './resources/Plan_erreur_colonnes.xlsx';
    const input = await pathToInput({ pathName });
    await expect(() => caller.plans.fiches.import(input)).rejects
      .toThrowError(`<strong>Erreur rencontrée dans le fichier Excel :</strong><br>
          La colonne <em>Q</em> devrait être "<strong>Financeur 1</strong>" et non "<strong>Budget prévisionnel total € HT</strong>"<br><br>
          <strong>Les colonnes attendues sont :</strong> <pre>Axe (x),Sous-axe (x.x),Sous-sous axe (x.x.x),Titre de l'action,Descriptif,Instances de gouvernance,Objectifs,Indicateurs liés,Structure pilote,Moyens humains et techniques,Partenaires,Direction ou service pilote,Personne pilote,Élu·e référent·e,Participation Citoyenne,Financements,Financeur 1,Montant € HT,Financeur 2,Montant € HT,Financeur 3,Montant € HT,Budget prévisionnel total € HT,Statut,Niveau de priorité,Date de début,Date de fin,Action en amélioration continue,Calendrier,Mesures liées,Actions des plans liées,Notes,Etapes de l'action,Documents et liens</pre><br>
          <strong>Les colonnes données sont   :</strong> <pre>Axe (x),Sous-axe (x.x), Sous-sous axe (x.x.x),Titre de l'action,Descriptif,Instances de gouvernance,Objectifs,Indicateurs liés,Structure pilote,Moyens humains et techniques,Partenaires ,Direction ou service pilote,Personne pilote,Élu·e référent·e ,Participation Citoyenne,Financements,Budget prévisionnel total € HT,Financeur 1,Montant € HT,Financeur 2,Montant € HT,Financeur 3,Montant € HT,Statut ,Niveau de priorité,Date de début,Date de fin,Action en amélioration continue,Calendrier,Mesures liées,Actions des plans liées,Notes,Etapes de l'action,Documents et liens</pre><br><br>

          Merci de la corriger avant de retenter un import.`);
  });
});
