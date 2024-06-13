import {Alert} from '@tet/ui';
import {makeCollectivitePlansActionsNouveauUrl} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useFonctionTracker} from 'core-logic/hooks/useFonctionTracker';
import {Link} from 'react-router-dom';
import ContextMenu from 'ui/shared/select/ContextMenu';
import {MenuTriggerButton} from 'ui/shared/select/MenuTriggerButton';

const DOWNLOAD_TEMPLATE_OPTIONS = [
  {value: 'xlsx', label: 'Format Excel (.xlsx)'},
  {value: 'ods', label: 'Format OpenDocument (.ods)'},
];

const ImporterPlan = () => {
  const collectivite_id = useCollectiviteId();

  const tracker = useFonctionTracker();

  return (
    <div className="max-w-3xl mx-auto flex flex-col grow py-12">
      <div className="w-full mx-auto">
        <h3 className="mb-8">
          <span className="fr-icon-upload-fill mr-2" /> Importer un plan
          d’action
        </h3>
        <div className="flex flex-col mt-2 mb-10 py-14 px-24 bg-[#f6f6f6]">
          <div className="mb-1 text-sm">Étape 1</div>
          <h6 className="mb-4">Téléchargez le modèle de plan d’action</h6>
          <p className="!mb-0">
            Pour importer votre plan, utilisez notre fichier modèle en
            téléchargement ci-dessous. Il correspond au format des fiches
            proposé dans la plateforme.
          </p>
          <div className="h-[1px] my-8 bg-gray-300" />

          <div className="mb-1 text-sm">Étape 2</div>
          <h6 className="mb-4">
            Adaptez votre plan d’action existant au format requis
          </h6>
          <p>Vous avez le choix entre :</p>
          <ul>
            <li>
              La version flash (onglet 2), pour importer en priorité la
              structure de votre plan et les informations clés pour le pilotage.
            </li>
            <li>
              La version complète (onglet 3) pour détailler et importer
              l’ensemble des informations de vos fiches action. Si vous
              choisissez celle-ci, remplissez tout ce que vous pouvez !
            </li>
          </ul>
          <p>
            Attention à bien respecter le format proposé pour que l’importation
            fonctionne !
          </p>
          <Alert
            title={`Pour toute question, contactez-nous sur le support en ligne 
              ou par email à contact@territoiresentransitions.fr. 
              Nous sommes là pour vous aider !`}
          />
          <div className="h-[1px] my-8 bg-gray-300" />

          <div className="mb-1 text-sm">Étape 3</div>
          <h6 className="mb-4">Envoyez-nous ce document par email</h6>
          <p>
            Adresse :{' '}
            <span className="font-bold">
              contact@territoiresentransitions.fr
            </span>
          </p>
          <p>
            Nous nous chargerons de l’importer sur la plateforme pour vous
            permettre de démarrer le suivi de votre plan d’action !
          </p>

          <div className="flex items-center gap-6 ml-auto mt-6">
            <Link
              className="fr-btn fr-btn--tertiary fr-btn--icon-left !mb-0 fr-icon-arrow-left-line hover:!bg-[#EEEEEE]"
              to={makeCollectivitePlansActionsNouveauUrl({
                collectiviteId: collectivite_id!,
              })}
            >
              Revenir à l’étape précédente
            </Link>
            <ContextMenu
              options={DOWNLOAD_TEMPLATE_OPTIONS}
              onSelect={(format: string) => {
                tracker({fonction: 'modele_import', action: 'telechargement'});
                window.open(
                  `/20231107-Fichier-Import-PA-NEW.${format}`,
                  '_blank'
                );
              }}
            >
              <MenuTriggerButton className="fr-btn fr-btn--icon-left fr-icon-download-line">
                Télécharger le modèle
              </MenuTriggerButton>
            </ContextMenu>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImporterPlan;
