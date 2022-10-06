import classNames from 'classnames';

type AlerteProps = {
  state: 'error' | 'information' | 'success' | 'warning';
  titre?: string;
  description?: string;
};

const Alerte = ({state, titre, description}: AlerteProps) => (
  <div
    className={classNames('fr-alert', {
      'fr-alert--info': state === 'information',
      'fr-alert--success': state === 'success',
      'fr-alert--warning': state === 'warning',
      'fr-alert--error': state === 'error',
    })}
  >
    {titre && <h3 className="fr-alert__title">{titre}</h3>}
    <p>{description}</p>
  </div>
);

export default Alerte;
