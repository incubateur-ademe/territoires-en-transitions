import InfoSection from '@components/sections/InfoSection';

type RessourcesProps = {
  description: string;
  cta: {
    label: string;
    url: string;
  }[];
};

const Ressources = ({description, cta}: RessourcesProps) => {
  return (
    <InfoSection
      content={description}
      buttons={cta.map((button, index) => ({
        title: button.label,
        href: button.url,
        variant: 'outlined',
        className:
          index === cta.length - 1 ? '!bg-[#FFE8BD] hover:bg-[#FFE4A8]' : '',
      }))}
    />
  );
};

export default Ressources;
