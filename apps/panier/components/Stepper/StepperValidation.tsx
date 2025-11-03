import classNames from 'classnames';

const stepToColor: Record<number, string> = {
  1: 'bg-primary-7',
  2: 'bg-primary-6',
  3: 'bg-primary-5',
  4: 'bg-primary-4',
  5: 'bg-primary-3',
};

type StepperValidationProps = {
  steps: string[];
  className?: string;
};

// TODO : Déplacer dans le package ui

const StepperValidation = ({ steps, className }: StepperValidationProps) => {
  return (
    <ul className={classNames('list-none', className)}>
      {steps.map((step, index) => (
        <li key={index} className="relative pb-6 last:pb-0">
          <div
            className={classNames(
              'absolute top-1/2 translate-y-1/2 left-3 bg-primary-6 w-[1px] h-1/3',
              {
                hidden: index === steps.length - 1,
              }
            )}
          />
          <div className="flex items-center relative">
            <span
              className={classNames(
                'shrink-0 rounded-full flex justify-center items-center w-6 h-6 text-white text-sm leading-6 font-bold',
                steps.length <= 5 ? stepToColor[index + 1] : 'bg-primary-6'
              )}
            >
              {index + 1}
            </span>
            <span className="ml-3 text-primary-9 text-sm font-normal">
              {step}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default StepperValidation;
