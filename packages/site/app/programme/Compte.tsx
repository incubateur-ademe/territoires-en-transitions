import InfoSection from '@components/sections/InfoSection';

type CompteProps = {
  description: string;
  cta: {
    label: string;
    url: string;
  };
};

const Compte = ({description, cta}: CompteProps) => {
  return (
    <InfoSection
      content={description}
      buttons={[
        {
          title: cta.label,
          href: cta.url,
          variant: 'outlined',
        },
      ]}
    />
  );
};

export default Compte;
