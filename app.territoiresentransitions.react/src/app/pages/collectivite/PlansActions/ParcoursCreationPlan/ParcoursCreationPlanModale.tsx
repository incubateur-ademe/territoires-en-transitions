import {useState} from 'react';
import ImporterPlan from './ImporterPlan';
import CreerPlan from './CreerPlan';
import Modal from 'ui/shared/floating-ui/Modal';
import Selection from './Selection';

export enum ParcoursCreationPlanSteps {
  SELECT = 'SELECT',
  IMPORTER = 'IMPORTER',
  CREER = 'CREER',
}

type Props = {
  children: JSX.Element;
};

const ParcoursCreationPlanModale = ({children}: Props) => {
  const [step, setStep] = useState(ParcoursCreationPlanSteps.SELECT);

  return (
    <Modal
      size="lg"
      onClose={() => setStep(ParcoursCreationPlanSteps.SELECT)}
      render={({close}) => (
        <>
          {step === ParcoursCreationPlanSteps.SELECT && (
            <Selection
              onStepClick={step => setStep(step)}
              onBackClick={close}
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
        </>
      )}
    >
      {children}
    </Modal>
  );
};

export default ParcoursCreationPlanModale;
