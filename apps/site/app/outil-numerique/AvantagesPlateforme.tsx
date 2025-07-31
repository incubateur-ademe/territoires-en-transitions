import { Vignette } from '@/site/app/types';
import ThumbnailsList from '@/site/components/galleries/ThumbnailsList';
import Section from '@/site/components/sections/Section';

type AvantagesPlateformeProps = {
  avantages: Vignette[];
};

const AvantagesPlateforme = ({ avantages }: AvantagesPlateformeProps) => {
  return (
    <Section containerClassName="bg-primary-1 max-md:!py-6 md:max-lg:!py-12 lg:!py-20">
      <ThumbnailsList
        thumbnails={avantages.map((a) => ({ ...a, legend: a.titre ?? '' }))}
      />
    </Section>
  );
};

export default AvantagesPlateforme;
