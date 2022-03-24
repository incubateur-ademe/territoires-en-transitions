import {ReactNode} from 'react';

/**
 * Affiche un bouton switch et libellé à sa gauche
 */
export const SwitchLabelLeft = ({
  id,
  checked,
  className,
  children,
  onChange,
}: TSwitchLabelLeftProps) => (
  <div
    className={`fr-toggle fr-toggle--label-left border-b ${className || ''}`}
  >
    <input
      type="checkbox"
      className="fr-toggle__input absolute right-0"
      id={id}
      checked={checked}
      onChange={e => onChange(e.currentTarget.checked)}
    />
    <label className="fr-toggle__label select-none" htmlFor={id}>
      {children}
    </label>
  </div>
);

export type TSwitchLabelLeftProps = {
  id: string;
  checked: boolean;
  className?: string;
  children: ReactNode;
  onChange: (checked: boolean) => void;
};
