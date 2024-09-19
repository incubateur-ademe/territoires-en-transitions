import InfoSection from '@tet/site/components/sections/InfoSection';

type RessourcesProps = {
  description: string;
};

const Ressources = ({ description }: RessourcesProps) => {
  return (
    <InfoSection
      content={description}
      buttons={[
        {
          title: 'Ressources',
          href: '/ressources',
          variant: 'outlined',
        },
        {
          title: 'Annuaire des conseillers',
          href: '/programme/annuaire',
          variant: 'outlined',
        },
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
