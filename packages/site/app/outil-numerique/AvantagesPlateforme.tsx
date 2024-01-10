import ThumbnailsList from '@components/galleries/ThumbnailsList';
import Section from '@components/sections/Section';
import {StrapiItem} from 'src/strapi/StrapiItem';

type AvantagesPlateformeProps = {
  avantages: {
    id: number;
    legende: string;
    image: StrapiItem;
  }[];
};

const AvantagesPlateforme = ({avantages}: AvantagesPlateformeProps) => {
  return (
    <Section containerClassName="bg-primary-1 !py-24">
      <ThumbnailsList
        thumbnails={avantages.map(a => ({...a, legend: a.legende}))}
      />
    </Section>
  );
};

export default AvantagesPlateforme;
