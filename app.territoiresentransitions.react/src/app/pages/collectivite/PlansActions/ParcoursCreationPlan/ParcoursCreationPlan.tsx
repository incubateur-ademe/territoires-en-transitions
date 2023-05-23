import {useState} from 'react';
import ImporterPlan from './ImporterPlan';
import CreerPlan from './CreerPlan';

enum ParcoursCreationPlanSteps {
  SELECT = 'SELECT',
  IMPORTER = 'IMPORTER',
  CREER = 'CREER',
}

const ParcoursCreationPlan = () => {
  const [step, setStep] = useState(ParcoursCreationPlanSteps.SELECT);

  return (
    <>
      {step === ParcoursCreationPlanSteps.SELECT && (
        <div className="flex gap-6">
          <SelectFlowButton
            title="Importer un plan d’action"
            subTitle="à partir d’un modèle"
            iconClass="fr-icon-upload-fill"
            onSelect={() => setStep(ParcoursCreationPlanSteps.IMPORTER)}
          />
          <SelectFlowButton
            title="Créer un plan d’action"
            subTitle="suivez le guide, pas à pas"
            iconClass="fr-icon-edit-box-fill"
            onSelect={() => setStep(ParcoursCreationPlanSteps.CREER)}
          />
        </div>
      )}
      {step === ParcoursCreationPlanSteps.IMPORTER && (
        <ImporterPlan
          onBackClick={() => setStep(ParcoursCreationPlanSteps.SELECT)}
        />
      )}
      {step === ParcoursCreationPlanSteps.CREER && (
        <CreerPlan
          onBackClick={() => setStep(ParcoursCreationPlanSteps.SELECT)}
        />
      )}
    </>
  );
};

export default ParcoursCreationPlan;

type SelectFlowButtonProps = {
  onSelect: () => void;
  iconClass: string;
  title: string;
  subTitle: string;
};

const SelectFlowButton = ({
  onSelect,
  iconClass,
  title,
  subTitle,
}: SelectFlowButtonProps) => (
  <div className="border border-gray-200 border-b-4 border-b-bf500">
    <button className="p-6" onClick={onSelect}>
      <div
        className={`${iconClass} flex !w-20 !h-20 mx-auto mb-6 before:!h-8 before:!w-8 before:!m-auto text-bf500`}
      />
      <div className="mb-2 font-bold">{title}</div>
      <div className="text-gray-500">{subTitle}</div>
    </button>
  </div>
);
