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
          href: 'https://auth.territoiresentransitions.fr/signup',
          external: true,
          variant: 'outlined',
        },
      ]}
    />
  );
};

export default Compte;
