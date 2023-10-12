import InfoSection from '@components/sections/InfoSection';
import CodingPicto from 'public/pictogrammes/CodingPicto';

type OffreProps = {
  description: string;
};

const Offre = ({description}: OffreProps) => {
  return (
    <InfoSection
      content={description}
      buttons={[
        {
          title: 'Créer un compte',
          href: 'https://app.territoiresentransitions.fr/auth/signup',
        },
      ]}
      pictogram={<CodingPicto />}
    />
  );
};

export default Offre;
