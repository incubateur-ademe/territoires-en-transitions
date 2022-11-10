import classNames from 'classnames';
import {ReactElement} from 'react';

type AlerteProps = {
  state: 'error' | 'information' | 'success' | 'warning';
  titre?: string;
  description?: string;
  children?: ReactElement;
  classname?: string;
};

const Alerte = ({
  state,
  titre,
  description,
  children,
  classname,
}: AlerteProps) => (
  <div
    className={classNames('fr-alert', classname, {
      'fr-alert--info': state === 'information',
      'fr-alert--success': state === 'success',
      'fr-alert--warning': state === 'warning',
      'fr-alert--error': state === 'error',
    })}
  >
    {titre && <h3 className="fr-alert__title">{titre}</h3>}
    {children ? children : <p>{description}</p>}
  </div>
);

export default Alerte;
