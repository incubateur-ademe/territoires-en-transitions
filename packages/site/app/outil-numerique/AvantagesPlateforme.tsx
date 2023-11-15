import Section from '@components/sections/Section';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
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
    <Section
      containerClassName="bg-primary-1 !py-24"
      className="md:!flex-row justify-center !gap-14 md:!gap-32 px-12 md:px-24"
    >
      {avantages.map(avantage => (
        <div
          key={avantage.id}
          className="flex flex-col items-center gap-8 md:gap-10"
        >
          <StrapiImage
            data={avantage.image}
            containerClassName="bg-white p-10 rounded-full"
          />
          <h6 className="text-primary-9 text-center text-[16px] md:text-[18px] leading-[22px] mb-0">
            {avantage.legende}
          </h6>
        </div>
      ))}
    </Section>
  );
};

export default AvantagesPlateforme;
