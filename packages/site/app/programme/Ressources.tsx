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
          tertiary: true,
        })),
        {
          title: 'Lire les questions fréquentes',
          href: '/faq',
          tertiary: true,
          className: '!bg-[#FFE8BD] hover:bg-[#FFE4A8]',
        },
      ]}
    />
  );
};

export default Ressources;
