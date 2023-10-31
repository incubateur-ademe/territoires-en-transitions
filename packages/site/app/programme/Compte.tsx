import InfoSection from '@components/sections/InfoSection';

type CompteProps = {
  description: string;
};

const Compte = ({description}: CompteProps) => {
  return (
    <InfoSection
      content={description}
      buttons={[
        {
          title: 'Créer un compte',
          href: 'https://app.territoiresentransitions.fr/auth/signup',
          external: true,
          variant: 'outlined',
        },
      ]}
    />
  );
};

export default Compte;
