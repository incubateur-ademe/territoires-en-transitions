import { Button } from '../Button';
import { ModalFooter } from './ModalFooter';
import { ModalFooterOKCancelProps } from './ModalFooterOKCancel';

type ModalFooterOKCancelWithStepsProps = ModalFooterOKCancelProps & {
  currentStep: number;
  cantGoToNextStep?: boolean;
  stepsCount: number;
  onStepChange: (step: number) => void;
};

/**
 * Variante de `ModalFooter` pour le cas courant "Annuler/Valider"
 */
export const ModalFooterOKCancelWithSteps = (
  props: ModalFooterOKCancelWithStepsProps
) => {
  const {
    btnOKProps,
    btnCancelProps,
    currentStep,
    stepsCount,
    onStepChange,
    cantGoToNextStep,
    ...remainingProps
  } = props;
  const { children: ok, ...btnOKRemainingProps } = btnOKProps;
  const { children: cancel, ...btnCancelRemainingProps } = btnCancelProps || {};

  return (
    <ModalFooter variant="right" {...remainingProps}>
      {btnCancelProps && (
        <Button type="button" variant="outlined" {...btnCancelRemainingProps}>
          {cancel || 'Annuler'}
        </Button>
      )}
      {currentStep > 1 && (
        <Button
          type="button"
          variant="outlined"
          {...btnCancelRemainingProps}
          icon="arrow-left-line"
          iconPosition="left"
          onClick={() => {
            onStepChange(currentStep - 1);
          }}
        >
          {`Étape ${currentStep - 1}`}
        </Button>
      )}
      {currentStep < stepsCount && (
        <Button
          type="submit"
          {...btnOKRemainingProps}
          icon="arrow-right-line"
          iconPosition="right"
          disabled={cantGoToNextStep}
          onClick={() => {
            onStepChange(currentStep + 1);
          }}
        >
          {`Étape ${currentStep + 1}`}
        </Button>
      )}
      {currentStep === stepsCount && (
        <Button type="submit" {...btnOKRemainingProps}>
          {ok || 'Valider'}
        </Button>
      )}
    </ModalFooter>
  );
};
