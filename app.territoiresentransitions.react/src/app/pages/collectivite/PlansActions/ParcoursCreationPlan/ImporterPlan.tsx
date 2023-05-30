import Alerte from 'ui/shared/Alerte';

type Props = {
  onBackClick: () => void;
};

const ImporterPlan = ({onBackClick}: Props) => {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <h3 className="mb-8">
        <span className="fr-icon-upload-fill mr-2" /> Importer un plan d’action
      </h3>
      <div className="flex flex-col mt-2 mb-10 py-14 px-24 bg-gray-100">
        <div className="mb-1 text-sm">Étape 1</div>
        <h6 className="mb-4">Téléchargez le modèle de plan d’action</h6>
        <p>
          Ce modèle correspond au format des fiches proposé dans la plateforme.
        </p>
        <a
          className="fr-btn fr-btn--icon-left fr-icon-download-line"
          href="https://docs.google.com/spreadsheets/d/1hmpj74Smtrzp-d5R3Rwlf9VRnokeKVDn/edit#gid=246577666"
          target="_blank"
          rel="noopener noreferrer"
        >
          Télécharger le modèle
        </a>
        <div className="h-[1px] my-8 bg-gray-300" />

        <div className="mb-1 text-sm">Étape 2</div>
        <h6 className="mb-4">
          Adaptez votre plan d’action existant au format requis
        </h6>
        <p>
          Renommez les colonnes de votre document tableur en suivant le modèle ;
          rassemblez plusieurs contenus si nécessaire.
        </p>
        <Alerte
          state="information"
          description="Pour toute question, contactez-nous sur le support en ligne ou par email à contact@territoiresentransitions.fr Nous sommes là pour vous aider !"
        />
        <div className="h-[1px] my-8 bg-gray-300" />

        <div className="mb-1 text-sm">Étape 3</div>
        <h6 className="mb-4">Envoyez-nous ce document par email</h6>
        <p>
          Adresse :{' '}
          <span className="font-bold">contact@territoiresentransitions.fr</span>
        </p>
        <p>
          Nous nous chargerons de l’importer sur la plateforme pour vous
          permettre de démarrer le suivi de votre plan d’action !
        </p>

        <div className="flex items-center gap-6 ml-auto mt-6">
          <button
            className="fr-btn fr-btn--tertiary fr-btn--icon-left !mb-0 fr-icon-arrow-left-line"
            onClick={onBackClick}
          >
            Revenir à l’étape précédente
          </button>
          <button className="fr-btn !mb-0">Valider</button>
        </div>
      </div>
    </div>
  );
};

export default ImporterPlan;
