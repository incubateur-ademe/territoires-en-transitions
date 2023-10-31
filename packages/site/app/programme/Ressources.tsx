import {ButtonVariant} from '@components/dstet/buttons/utils';
import InfoSection from '@components/sections/InfoSection';

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
      buttons={[
        ...buttons.map(b => ({
          ...b,
          title: b.titre,
          external: true,
          variant: 'outlined' as ButtonVariant,
        })),
        {
          title: 'Lire les questions fréquentes',
          href: '/faq',
          variant: 'outlined',
          className: '!bg-[#FFE8BD] hover:bg-[#FFE4A8]',
        },
      ]}
    />
  );
};

export default Ressources;
