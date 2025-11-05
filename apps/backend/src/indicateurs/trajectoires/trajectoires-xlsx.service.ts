import { CollectiviteResume } from '@/domain/collectivites';
import { VerificationTrajectoireStatus } from '@/domain/indicateurs';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { default as XlsxTemplate } from 'xlsx-template';
import { CollectiviteIdInput } from '../../collectivites/collectivite-id.input';
import { AuthenticatedUser } from '../../users/models/auth.models';
import BackendConfigurationService from '../../utils/config/configuration.service';
import SheetService from '../../utils/google-sheets/sheet.service';
import { DataInputForTrajectoireCompute } from './donnees-calcul-trajectoire-a-remplir.dto';
import { ModeleTrajectoireTelechargementRequestType } from './modele-trajectoire-telechargement.request';
import TrajectoiresDataService from './trajectoires-data.service';

@Injectable()
export default class TrajectoiresXlsxService {
  private readonly logger = new Logger(TrajectoiresXlsxService.name);

  private xlsxModeleBuffer: Buffer | null = null;
  private xlsxVideBuffer: Buffer | null = null;

  constructor(
    private readonly configService: BackendConfigurationService,
    private readonly sheetService: SheetService,
    private readonly trajectoiresDataService: TrajectoiresDataService
  ) {
    this.initXlsxBuffers();
  }

  getIdentifiantXlsxCalcul() {
    return this.configService.get('TRAJECTOIRE_SNBC_XLSX_ID');
  }

  getNomFichierTrajectoire(epci: Pick<CollectiviteResume, 'siren' | 'nom'>) {
    return `Trajectoire SNBC - ${epci.siren} - ${epci.nom}`;
  }

  async downloadModeleTrajectoireSnbc(
    request: ModeleTrajectoireTelechargementRequestType,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!this.getIdentifiantXlsxCalcul()) {
        throw new InternalServerErrorException(
          "L'identifiant du Xlsx pour le calcul des trajectoires SNBC est manquant"
        );
      }

      await this.initXlsxBuffers(request.forceRecuperationXlsx);
      const nomFichier = await this.sheetService.getFileName(
        this.getIdentifiantXlsxCalcul()
      );

      // Set the output file name.
      res.attachment(nomFichier);
      res.set('Access-Control-Expose-Headers', 'Content-Disposition');

      // Send the workbook.
      res.send(this.xlsxVideBuffer);
    } catch (error) {
      next(error);
    }
  }

  async initXlsxBuffers(forceRecuperation?: boolean) {
    if (!this.xlsxModeleBuffer || forceRecuperation) {
      this.logger.log(
        `Récupération des données du fichier Xlsx de calcul ${this.getIdentifiantXlsxCalcul()} (force: ${forceRecuperation})`
      );
      this.xlsxModeleBuffer = await this.sheetService.getFileData(
        this.getIdentifiantXlsxCalcul()
      );

      if (this.xlsxModeleBuffer) {
        this.logger.log(`Création du buffer sans données du fichier Xlsx`);
        const nouveauBuffer = Buffer.from(
          this.xlsxModeleBuffer as unknown as string
        );
        this.xlsxVideBuffer = await this.generationXlsxDonneesSubstituees(
          nouveauBuffer,
          { siren: null },
          null
        );
      } else {
        // Null in test
        this.logger.warn(`Le fichier Xlsx de calcul n'a pas été trouvé`);
      }
    }
  }

  async getXlsxModeleBuffer(): Promise<Buffer> {
    if (!this.xlsxModeleBuffer) {
      this.logger.log(`Récupération du buffer du fichier Xlsx de calcul`);
      await this.initXlsxBuffers();
    } else {
      this.logger.log(
        `Utilisation du buffer du fichier Xlsx de calcul déjà chargé`
      );
    }
    return Buffer.from(this.xlsxModeleBuffer as unknown as string);
  }

  getXlsxCleSubstitution(identifiantsReferentiel: string[]): string {
    return identifiantsReferentiel.join('-').replace(/\./g, '_');
  }

  async generationXlsxDonneesSubstituees(
    xlsxBuffer: Buffer,
    siren: {
      siren: number | null;
    },
    valeurIndicateurs: DataInputForTrajectoireCompute | null
  ): Promise<Buffer> {
    // Utilisation de xlsx-template car:
    // https://github.com/SheetJS/sheetjs/issues/347: sheetjs does not keep style
    // https://github.com/exceljs/exceljs: fails to read the file
    // https://github.com/dtjohnson/xlsx-populate: pas de typage et ecriture semble corrompre le fichier

    // Create a template
    this.logger.log(`Création du XlsxTemplate`);
    const template = new XlsxTemplate(xlsxBuffer);

    this.logger.log(`Substitution du Siren`);
    const sirenSheetName =
      this.trajectoiresDataService.SNBC_SIREN_CELLULE.split('!')[0];
    template.substitute(sirenSheetName, siren);

    this.logger.log(`Substitution des valeurs des indicateurs`);
    const emissionsGesSequestrationConsommationsSheetName =
      this.trajectoiresDataService.SNBC_EMISSIONS_GES_CELLULES.split('!')[0];

    const emissionGesSequestrationConsommationsSubstitionValeurs: any = {};
    this.trajectoiresDataService.SNBC_EMISSIONS_GES_IDENTIFIANTS_REFERENTIEL.forEach(
      (identifiants) => {
        const cleSubstitution = this.getXlsxCleSubstitution(identifiants);
        emissionGesSequestrationConsommationsSubstitionValeurs[
          cleSubstitution
        ] = 0;
      }
    );
    this.trajectoiresDataService.SNBC_SEQUESTRATION_IDENTIFIANTS_REFERENTIEL.forEach(
      (identifiants) => {
        const cleSubstitution = this.getXlsxCleSubstitution(identifiants);
        emissionGesSequestrationConsommationsSubstitionValeurs[
          cleSubstitution
        ] = 0;
      }
    );
    this.trajectoiresDataService.SNBC_CONSOMMATIONS_IDENTIFIANTS_REFERENTIEL.forEach(
      (identifiants) => {
        const cleSubstitution = this.getXlsxCleSubstitution(identifiants);
        emissionGesSequestrationConsommationsSubstitionValeurs[
          cleSubstitution
        ] = 0;
      }
    );
    valeurIndicateurs?.emissionsGes.valeurs.forEach((valeur) => {
      const cleSubstitution = this.getXlsxCleSubstitution(
        valeur.identifiantsReferentiel
      );
      emissionGesSequestrationConsommationsSubstitionValeurs[cleSubstitution] =
        valeur.valeur || 0;
    });
    valeurIndicateurs?.sequestrations.valeurs.forEach((valeur) => {
      const cleSubstitution = this.getXlsxCleSubstitution(
        valeur.identifiantsReferentiel
      );
      emissionGesSequestrationConsommationsSubstitionValeurs[cleSubstitution] =
        (valeur.valeur || 0) * -1;
    });
    valeurIndicateurs?.consommationsFinales.valeurs.forEach((valeur) => {
      const cleSubstitution = this.getXlsxCleSubstitution(
        valeur.identifiantsReferentiel
      );
      emissionGesSequestrationConsommationsSubstitionValeurs[cleSubstitution] =
        valeur.valeur || 0;
    });
    template.substitute(
      emissionsGesSequestrationConsommationsSheetName,
      emissionGesSequestrationConsommationsSubstitionValeurs
    );

    // TODO: type it
    const zipOptions: any = {
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 2,
      },
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    this.logger.log(`Génération du buffer de fichier Xlsx`);
    const generatedData = template.generate(zipOptions as any);
    return generatedData;
  }

  async downloadTrajectoireSnbc(
    { collectiviteId }: CollectiviteIdInput,
    tokenInfo: AuthenticatedUser,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!this.getIdentifiantXlsxCalcul()) {
        throw new InternalServerErrorException(
          "L'identifiant du Xlsx pour le calcul des trajectoires SNBC est manquant"
        );
      }

      const resultatVerification =
        await this.trajectoiresDataService.verificationDonneesSnbc({
          request: { collectiviteId, forceRecuperationDonnees: true },
          tokenInfo,
          epci: undefined,
          doNotThrowIfUnauthorized: true,
        });

      if (
        resultatVerification.status ===
          VerificationTrajectoireStatus.COMMUNE_NON_SUPPORTEE ||
        !resultatVerification.epci
      ) {
        throw new UnprocessableEntityException(
          `Le calcul de trajectoire SNBC peut uniquement être effectué pour un EPCI.`
        );
      }

      if (
        resultatVerification.status ===
          VerificationTrajectoireStatus.DONNEES_MANQUANTES ||
        !resultatVerification.donneesEntree
      ) {
        const identifiantsReferentielManquants = [
          ...(resultatVerification.donneesEntree?.emissionsGes
            .identifiantsReferentielManquants || []),
          ...(resultatVerification.donneesEntree?.consommationsFinales
            .identifiantsReferentielManquants || []),
        ];
        throw new UnprocessableEntityException(
          `Les indicateurs suivants n'ont pas de valeur pour l'année 2015 ou avec une interpolation possible : ${identifiantsReferentielManquants.join(
            ', '
          )}, impossible de calculer la trajectoire SNBC.`
        );
      }
      const epci = resultatVerification.epci;
      const nomFichier = this.getNomFichierTrajectoire(epci);

      this.logger.log(
        `Récupération des données du fichier ${this.getIdentifiantXlsxCalcul()}`
      );
      const xlsxBuffer = await this.getXlsxModeleBuffer();

      const sirenData = {
        siren: epci.siren ? parseInt(epci.siren) : null,
      };

      const generatedData = await this.generationXlsxDonneesSubstituees(
        xlsxBuffer,
        sirenData,
        resultatVerification.donneesEntree
      );

      this.logger.log(`Renvoi du fichier Xlsx généré`);
      // Send the workbook.
      res.attachment(`${nomFichier}.xlsx`.normalize('NFD'));
      res.set('Access-Control-Expose-Headers', 'Content-Disposition');
      res.send(generatedData);
    } catch (error) {
      next(error);
    }
  }
}
