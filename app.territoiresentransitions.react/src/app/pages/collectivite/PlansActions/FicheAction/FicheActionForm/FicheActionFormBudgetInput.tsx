import {InputHTMLAttributes, useState} from 'react';
import {onlyNumericRegExp, useInputFilterRef} from 'ui/shared/form/utils';

type Props<T> = {
  budget: number | null;
} & InputHTMLAttributes<T>;

const FicheActionFormBudgetInput = <T extends HTMLInputElement>({
  budget,
  onBlur,
  disabled,
}: Props<T>) => {
  const [value, setValue] = useState(budget?.toString());

  /** Ajoute le filtre numérique sur l'input budget */
  const inputBudgetRef = useInputFilterRef<HTMLInputElement>(
    onlyNumericRegExp,
    'Nombre uniquement'
  );

  return (
    <div className="flex items-baseline mt-3">
      <input
        ref={inputBudgetRef}
        type="text"
        id="budget-previsionnel"
        className="w-52 py-1 px-3 text-sm rounded-md focus:!outline focus:!outline-1 focus:outline-blue-500"
        value={value}
        onChange={e => setValue(e.target.value.replace(',', '.'))}
        onBlur={onBlur}
        maxLength={20}
        placeholder="Écrire ici..."
        disabled={disabled}
      />
      <span className="ml-2 text-sm">€ TTC</span>
    </div>
  );
};

export default FicheActionFormBudgetInput;
