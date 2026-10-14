import { INestApplication } from '@nestjs/common';
import SheetService from '@tet/backend/utils/google-sheets/sheet.service';
import { vi } from 'vitest';
import { trajectoireSnbcCalculRetour } from './fixtures/trajectoire-snbc-calcul-retour';
import TrajectoiresDataService from './trajectoires-data.service';

/**
 * Remplace les appels Google Sheets/Drive du calcul de trajectoire SNBC par le
 * retour enregistré d'un vrai calcul : sans ça, chaque calcul en test dépend de
 * la latence et des quotas de Google, et dépasse parfois le timeout.
 *
 * Renvoie la fonction qui rétablit le vrai service.
 */
export function mockTrajectoireSnbcSheetService(
  app: INestApplication
): () => void {
  const sheetService = app.get(SheetService);
  const trajectoiresDataService = app.get(TrajectoiresDataService);

  const recordedIndicateurs = Object.values(
    trajectoireSnbcCalculRetour.trajectoire
  ).flat();
  const recordedRows =
    trajectoiresDataService.SNBC_TRAJECTOIRE_RESULTAT_IDENTIFIANTS_REFERENTIEL.map(
      (identifiant) =>
        recordedIndicateurs
          .find(
            ({ definition }) =>
              definition.identifiantReferentiel === identifiant
          )
          ?.valeurs.map(({ objectif }) => objectif) ?? []
    );

  const spies = [
    vi.spyOn(sheetService, 'getFileIdByName').mockResolvedValue(null),
    vi
      .spyOn(sheetService, 'copyFile')
      .mockResolvedValue('test-trajectoire-snbc-spreadsheet'),
    vi.spyOn(sheetService, 'deleteFile').mockResolvedValue(),
    vi.spyOn(sheetService, 'overwriteRawDataToSheet').mockResolvedValue(),
    vi
      .spyOn(sheetService, 'getRawDataFromSheet')
      .mockResolvedValue({ data: recordedRows }),
  ];

  return () => {
    spies.forEach((spy) => spy.mockRestore());
  };
}
