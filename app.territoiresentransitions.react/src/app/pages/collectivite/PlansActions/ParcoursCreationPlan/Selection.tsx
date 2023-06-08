import {ParcoursCreationPlanSteps} from './ParcoursCreationPlan';

type Props = {
  onStepClick: (step: ParcoursCreationPlanSteps) => void;
  onBackClick: () => void;
};

const Selection = ({onStepClick, onBackClick}: Props) => {
  return (
    <div className="w-full mx-auto">
      <h3 className="mb-8">Ajouter un plan d’action</h3>
      <div className="flex flex-col mt-2 mb-10 py-14 px-24 bg-gray-100">
        <h6 className="ml-8">Vous souhaitez</h6>
        <div className="flex justify-center gap-6">
          <SelectFlowButton
            dataTest="ImporterPlan"
            title="Importer un plan d’action"
            subTitle="à partir d’un modèle"
            iconClass="fr-icon-upload-fill"
            onSelect={() => {
              onStepClick(ParcoursCreationPlanSteps.IMPORTER);
              scrollToTop();
            }}
          />
          <SelectFlowButton
            dataTest="CreerPlan"
            title="Créer un plan d’action"
            subTitle="suivez le guide, pas à pas"
            iconClass="fr-icon-edit-box-fill"
            onSelect={() => {
              onStepClick(ParcoursCreationPlanSteps.CREER);
              scrollToTop();
            }}
          />
        </div>
        <button
          className="fr-btn fr-btn--tertiary mt-10 ml-auto"
          onClick={onBackClick}
        >
          Annuler
        </button>
      </div>
    </div>
  );
};

export default Selection;

type SelectFlowButtonProps = {
  dataTest?: string;
  onSelect: () => void;
  iconClass: string;
  title: string;
  subTitle: string;
};

const SelectFlowButton = ({
  dataTest,
  onSelect,
  iconClass,
  title,
  subTitle,
}: SelectFlowButtonProps) => (
  <div className="bg-white border border-gray-200 border-b-4 border-b-bf500">
    <button data-test={dataTest} className="p-6" onClick={onSelect}>
      <div
        className={`${iconClass} flex !w-20 !h-20 mx-auto mb-6 before:!h-8 before:!w-8 before:!m-auto text-bf500`}
      />
      <div className="mb-2 font-bold">{title}</div>
      <div className="text-gray-500">{subTitle}</div>
    </button>
  </div>
);
