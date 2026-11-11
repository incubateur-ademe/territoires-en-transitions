import { SIMULATEUR_TERRITORIAL_URL } from '@/app/indicateurs/trajectoires/trajectoire-constants';
import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';
import { useTelechargementMethodologieSnbc3 } from './data/use-telechargement-methodologie-snbc3';
import { useTelechargementOutilSnbc3 } from './data/use-telechargement-outil-snbc3';
import { useTelechargementTrajectoireSnbc3 } from './data/use-telechargement-trajectoire-snbc3';
import { DownloadLabel } from './download-label';

/**
 * « Aller plus loin » de la page SNBC 3 : le classeur ouvert sur le territoire
 * (« Mes données »), l'outil Excel tel qu'il est publié, et la documentation.
 */
export const AllerPlusLoinSnbc3 = () => {
  const { mutate: downloadDonnees, isPending: isDownloadingDonnees } =
    useTelechargementTrajectoireSnbc3();
  const { mutate: downloadOutil, isPending: isDownloadingOutil } =
    useTelechargementOutilSnbc3();
  const { mutate: downloadMethodologie, isPending: isDownloadingMethodologie } =
    useTelechargementMethodologieSnbc3();

  return (
    <div>
      <h6 className="mb-4 text-base">
        {appLabels.trajectoireSnbc3AllerPlusLoinOutil}
      </h6>
      <div className="flex flex-wrap gap-4">
        <Button
          size="sm"
          onClick={() => downloadDonnees()}
          disabled={isDownloadingDonnees}
          dataTest="indicateurs.trajectoires.snbc3.telecharger-donnees"
        >
          <DownloadLabel isPending={isDownloadingDonnees}>
            {appLabels.trajectoireSnbc3TelechargerDonnees}
          </DownloadLabel>
        </Button>
        <Button
          size="sm"
          variant="outlined"
          onClick={() => downloadOutil()}
          disabled={isDownloadingOutil}
          dataTest="indicateurs.trajectoires.snbc3.aller-plus-loin.telecharger-outil"
        >
          <DownloadLabel isPending={isDownloadingOutil}>
            {appLabels.trajectoireSnbc3TelechargerOutil}
          </DownloadLabel>
        </Button>
      </div>

      <h6 className="mt-8 mb-4 text-base">{appLabels.documentation}</h6>
      <div className="flex flex-wrap gap-4">
        <Button
          size="sm"
          variant="outlined"
          onClick={() => downloadMethodologie()}
          disabled={isDownloadingMethodologie}
        >
          {appLabels.trajectoireSnbc3ConsulterMethodologie}
        </Button>

        <Button
          size="sm"
          variant="outlined"
          external
          href={SIMULATEUR_TERRITORIAL_URL}
        >
          {appLabels.trajectoireVoirSimulateurSgpe}
        </Button>
      </div>
    </div>
  );
};
