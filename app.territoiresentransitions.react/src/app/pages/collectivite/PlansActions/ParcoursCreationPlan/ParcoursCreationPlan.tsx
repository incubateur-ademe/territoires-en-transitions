import {useState} from 'react';
import ImporterPlan from './ImporterPlan';
import CreerPlan from './CreerPlan';
import Selection from './Selection';

export enum ParcoursCreationPlanSteps {
  SELECT = 'SELECT',
  IMPORTER = 'IMPORTER',
  CREER = 'CREER',
}

const ParcoursCreationPlan = () => {
  const [step, setStep] = useState(ParcoursCreationPlanSteps.SELECT);

  return (
    <div className="max-w-3xl m-auto flex flex-col grow py-12">
      {step === ParcoursCreationPlanSteps.SELECT && (
        <Selection
          onStepClick={step => setStep(step)}
          onBackClick={() => null}
        />
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
    </div>
  );
};

export default ParcoursCreationPlan;
