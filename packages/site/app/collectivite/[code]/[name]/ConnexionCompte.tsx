import ButtonWithLink from '@components/buttons/ButtonWithLink';

const ConnexionCompte = () => {
  return (
    <div className="flex flex-col items-center md:rounded-[10px] bg-primary-1 md:bg-white py-10 px-8 lg:p-8">
      <p className="text-center text-primary-8 font-bold text-[18px] leading-[28px]">
        Vous êtes membre de cette collectivité ?
      </p>
      <ButtonWithLink href="https://app.territoiresentransitions.fr/auth/signin">
        Se connecter
      </ButtonWithLink>
    </div>
  );
};

export default ConnexionCompte;
