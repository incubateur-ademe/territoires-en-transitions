import InfoSection from '@components/sections/InfoSection';
import DocumentPicto from 'public/pictogrammes/DocumentPicto';

type RessourcesProps = {
  description: string;
  buttons: {
    titre: string;
    href: string;
  }[];
};

const Ressources = ({description, buttons}: RessourcesProps) => {
  return (
    <InfoSection
      content={description}
      buttons={buttons.map(b => ({...b, title: b.titre, external: true}))}
      pictogram={<DocumentPicto />}
      customBackground="#6a6af4"
      customTextStyle="text-white"
    />
  );
};

export default Ressources;
