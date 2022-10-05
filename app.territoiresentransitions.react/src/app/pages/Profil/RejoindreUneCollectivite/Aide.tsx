import {useState} from 'react';

const Aide = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-6 border-t border-b border-gray-200">
      <button
        className="flex items-center w-full py-2 px-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span
          className={`mr-4 text-blue-600 ${
            isOpen ? 'fr-fi-information-fill' : 'fr-fi-information-line'
          }`}
        />
        <span>Aide</span>
        <span className="ml-auto mb-2 text-2xl leading-none">
          {isOpen ? '-' : '+'}
        </span>
      </button>
      {isOpen && (
        <div className="mt-2 mb-4 px-4 text-gray-500">
          <div className="italic mb-2">
            Vous ne trouvez pas la collectivité que vous recherchez ?
          </div>
          <div>
            Envoyez un email à contact@territoiresentransitions.fr avec le nom
            de la collectivité et son numéro SIREN pour que nous puissions vous
            aider.
          </div>
        </div>
      )}
    </div>
  );
};

export default Aide;
