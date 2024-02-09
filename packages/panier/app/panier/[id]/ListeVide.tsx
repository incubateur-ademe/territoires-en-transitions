import SuccessPicto from '@components/Picto/SuccessPicto';

const ListeVide = () => {
  return (
    <div className="bg-white rounded-lg border-[0.5px] border-primary-3 px-4 py-24 flex flex-col justify-center items-center">
      <SuccessPicto className="mb-4" />
      <h6 className="text-primary-8 text-lg font-bold text-center mb-0">
        Félicitations, votre politique de transition écologique semble bien
        avancée.
      </h6>
      <h6 className="text-grey-6 text-lg font-bold text-center mb-0">
        Toutes les actions à impact sont déjà mises en œuvre ou en cours dans
        votre collectivité !
      </h6>
    </div>
  );
};

export default ListeVide;
