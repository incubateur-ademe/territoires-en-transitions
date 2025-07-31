import SearchPicto from '@/panier/components/Picto/SearchPicto';
import SuccessPicto from '@/panier/components/Picto/SuccessPicto';
import Fireworks from 'react-canvas-confetti/dist/presets/fireworks';

type ListeVideProps = {
  success?: boolean;
};

const ListeVide = ({ success }: ListeVideProps) => {
  return (
    <div className="bg-white rounded-lg border-[0.5px] border-primary-3 px-8 pt-2 pb-8 flex flex-col justify-center items-center w-full grow relative">
      {success && (
        <Fireworks
          autorun={{ speed: 3, duration: 600 }}
          className="absolute top-0 left-0 w-full h-full"
        />
      )}

      {success ? (
        <SuccessPicto className="mb-6" />
      ) : (
        <SearchPicto className="my-6" />
      )}
      <h6 className="text-primary-8 text-lg font-bold text-center mb-0">
        {success
          ? 'Félicitations, votre politique de transition écologique semble bien avancée.'
          : "Désolé, aucune correspondance n'a été trouvée pour votre recherche !"}
      </h6>
      <h6 className="text-grey-6 text-lg font-bold text-center mb-0">
        {success
          ? 'Toutes les actions à impact sont déjà mises en œuvre ou en cours dans votre collectivité !'
          : " Modifiez vos critères pour obtenir des résultats. Pour toute question, n'hésitez pas à nous contacter via le chat."}
      </h6>
    </div>
  );
};

export default ListeVide;
