'use client';
import { useRouter } from 'next/navigation';
import { Fragment } from 'react';

import { ExternalLink } from '@/app/ui/externalLink/ExternalLink';
import { Button, ButtonMenu, Event, Icon, useEventTracker } from '@/ui';

const DOWNLOAD_TEMPLATE_OPTIONS = [
  { value: 'xlsx', label: 'Format Excel (.xlsx)' },
  { value: 'ods', label: 'Format OpenDocument (.ods)' },
];

export const RequestPlanImportView = () => {
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
          <DownloadMenu />
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
              />
            </li>
            <li>
              Consultez notre article sur les prochaines étapes{' '}
              <ExternalLink
                href={
                  'https://aide.territoiresentransitions.fr/fr/article/plan-daction-en-ligne-les-prochaines-etapes-lx9mnb'
                }
                text={'en cliquant ici.'}
              />
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
              />
            </li>
            <li>
              Prenez un rendez-vous individuel avec notre équipe{' '}
              <ExternalLink
                href={
                  'https://calendly.com/territoiresentransitions/entretien-support-plan-d-action'
                }
                text={'en cliquant ici.'}
              />
            </li>
          </ul>
          <div className="h-[1px] my-8 bg-gray-300" />

          <div className="flex gap-6 mt-3">
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

const DownloadMenu = () => {
  const trackEvent = useEventTracker();
  return (
    <ButtonMenu icon="download-line" size="sm" text="Télécharger le modèle">
      <div className="flex flex-col">
        {DOWNLOAD_TEMPLATE_OPTIONS.map((option, index) => (
          <Fragment key={option.value}>
            <button
              className="py-2 px-3 text-sm text-primary-9 hover:!bg-primary-1"
              onClick={() => {
                trackEvent(Event.fiches.downloadModele, {
                  format: option.value,
                });
                window.open(`/modele-import-pa.${option.value}`, '_blank');
              }}
            >
              {option.label}
            </button>
            {index < DOWNLOAD_TEMPLATE_OPTIONS.length - 1 && (
              <div className="h-[1px] bg-grey-4" />
            )}
          </Fragment>
        ))}
      </div>
    </ButtonMenu>
  );
};
