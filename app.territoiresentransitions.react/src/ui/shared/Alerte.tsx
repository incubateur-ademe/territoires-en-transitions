import classNames from 'classnames';

type AlerteProps = {
  state: 'error' | 'information' | 'success';
  titre?: string;
  description?: string;
};

const Alerte = ({state, titre, description}: AlerteProps) => {
  return (
    <div
      className={classNames('flex border-2', {
        'border-blue-500': state === 'information',
        'border-green-500': state === 'success',
        'border-red-500': state === 'error',
      })}
    >
      <div
        className={classNames('p-3', {
          'bg-blue-600': state === 'information',
          'bg-green-500': state === 'success',
          'bg-red-500': state === 'error',
        })}
      >
        <div
          className={classNames('text-white', {
            'fr-fi-information-fill': state === 'information',
            'fr-fi-checkbox-circle-fill': state === 'success',
            'fr-fi-error-warning-fill': state === 'error',
          })}
        />
      </div>
      <div className="px-4 py-3">
        {titre && <span className="block mb-2 font-bold text-lg">{titre}</span>}
        <span className="block w-full text-sm">{description}</span>
      </div>
    </div>
  );
};

export default Alerte;
