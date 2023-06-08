import classNames from 'classnames';
import DOMPurify from 'dompurify';
import {ReactElement} from 'react';

type TAlerteState = 'error' | 'information' | 'success' | 'warning';

const alertStateClasses: Record<TAlerteState, string> = {
  information: 'fr-alert--info',
  success: 'fr-alert--success',
  warning: 'fr-alert--warning',
  error: 'fr-alert--error',
};

type AlerteProps = {
  state: 'error' | 'information' | 'success' | 'warning';
  titre?: string;
  description?: string;
  children?: ReactElement;
  classname?: string;
  small?: boolean;
};

const Alerte = ({
  state,
  titre,
  description,
  children,
  classname,
  small,
}: AlerteProps) => (
  <div
    className={classNames('fr-alert', classname, alertStateClasses[state], {
      'fr-alert--sm': small,
    })}
  >
    {titre && <h3 className="fr-alert__title">{titre}</h3>}
    {children
      ? children
      : description && (
          <p
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(description),
            }}
          />
        )}
  </div>
);

export default Alerte;
