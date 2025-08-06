'use client';
import { ExternalLink } from '@/app/ui/externalLink/ExternalLink';
import ContextMenu from '@/app/ui/shared/select/ContextMenu';
import { Button, Event, Icon, useEventTracker } from '@/ui';
import { useRouter } from 'next/navigation';

const DOWNLOAD_TEMPLATE_OPTIONS = [
  { value: 'xlsx', label: 'Format Excel (.xlsx)' },
  { value: 'ods', label: 'Format OpenDocument (.ods)' },
];

export const RequestPlanImportView = () => {
  const trackEvent = useEventTracker();
  const router = useRouter();
  const goBackToPreviousPage = () => {
    router.back();
  };
  return (
    <div className="flex flex-col grow">
      <div className="w-full mx-auto">
        <h3 className="mb-8">
          <Icon icon="import-fill" size="lg" className="mr-2" />
          Importer un plan d’action
        </h3>
        <div className="flex flex-col mt-2 mb-10 py-14 px-24 bg-white rounded-lg">
          <div className="mb-1 text-sm">Étape 1</div>
          <h6 className="mb-4">Téléchargez le modèle de plan d’action</h6>
          <p className="mb-4">
            Il est structuré selon le format attendu par la plateforme.
          </p>
          <ContextMenu
            options={DOWNLOAD_TEMPLATE_OPTIONS}
            onSelect={(format: string) => {
              trackEvent(Event.fiches.downloadModele, { format });
              window.open(`/modele-import-pa.${format}`, '_blank');
            }}
          >
            <Button icon="download-line" size="sm">
              Télécharger le modèle
            </Button>
          </ContextMenu>
          <div className="h-[1px] my-8 bg-gray-300" />

          <div className="mb-1 text-sm">Étape 2</div>
          <h6 className="mb-4">
            Complétez le fichier avec les informations de votre plan d’action
          </h6>
          <p>
            Le modèle vous permet de renseigner la structure du plan ainsi que
            les principales données utiles au pilotage. Le reste sera a
            compléter sur la plateforme.
          </p>
          <p className="mb-0">
            Veillez à bien respecter les consignes de remplissage présentes dans
            le fichier, pour garantir la bonne prise en compte des données lors
            de l’import sur la plateforme.
          </p>
          <div className="h-[1px] my-8 bg-gray-300" />

          <div className="mb-1 text-sm">Étape 3</div>
          <h6 className="mb-4">Envoyez-nous le fichier complété par email</h6>
          <p>
            Adresse :{' '}
            <span className="font-bold">
              contact@territoiresentransitions.fr
            </span>
          </p>
          <p className="mb-0">
            Nous vous informons dès que l’import est réalisé. Des questions
            pendant le remplissage, contactez nous.
          </p>

          <div className="h-[1px] my-8 bg-gray-300" />

          <div className="mb-1 text-sm">Étape 4</div>
          <h6>{"Une fois l'import réalisé"}</h6>
          <ul className="mb-0">
            <li>
              Suivez une démo post import{' '}
              <ExternalLink
                href={
                  'https://calendly.com/territoiresentransitions/demo-optimisation-pilotage-actions'
                }
                text={'en cliquant ici.'}
              ></ExternalLink>
            </li>
            <li>
              Consultez notre article sur les prochaines étapes{' '}
              <ExternalLink
                href={
                  'https://aide.territoiresentransitions.fr/fr/article/plan-daction-en-ligne-les-prochaines-etapes-lx9mnb'
                }
                text={'en cliquant ici.'}
              ></ExternalLink>
            </li>
          </ul>
          <div className="h-[1px] my-8 bg-gray-300" />
          <h6 className="mb-4">Ressources</h6>
          <ul className="mb-0">
            <li>
              Visualisez une vidéo de présentation du fichier d’import{' '}
              <ExternalLink
                href={'https://www.youtube.com/watch?v=jQ6qnXH4tKY'}
                text={'en cliquant ici.'}
              ></ExternalLink>
            </li>
            <li>
              Prenez un rendez-vous individuel avec notre équipe{' '}
              <ExternalLink
                href={
                  'https://calendly.com/territoiresentransitions/entretien-support-plan-d-action'
                }
                text={'en cliquant ici.'}
              ></ExternalLink>
            </li>
          </ul>
          <div className="h-[1px] my-8 bg-gray-300" />

          <div className=" gap-6 mt-3">
            <Button
              variant="outlined"
              icon="arrow-left-line"
              size="sm"
              onClick={goBackToPreviousPage}
              type="button"
            >
              Revenir à l’étape précédente
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
