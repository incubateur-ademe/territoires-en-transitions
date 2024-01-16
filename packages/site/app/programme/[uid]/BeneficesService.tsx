import ThumbnailsList from '@components/galleries/ThumbnailsList';
import Section from '@components/sections/Section';
import {StrapiItem} from 'src/strapi/StrapiItem';

type BeneficesServiceProps = {
  liste: {
    id: number;
    legende: string;
    image: StrapiItem;
  }[];
};

const BeneficesService = ({liste}: BeneficesServiceProps) => {
  return (
    <Section containerClassName="bg-primary-1 !py-24">
      <h2 className="text-center mb-8">Les bénéfices</h2>
      <ThumbnailsList
        thumbnails={liste.map(l => ({...l, legend: l.legende}))}
      />
    </Section>
  );
};

export default BeneficesService;
