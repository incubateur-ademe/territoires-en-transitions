/* eslint-disable react/no-unescaped-entities */
import ButtonWithLink from '@components/dstet/buttons/ButtonWithLink';
import Section from '@components/sections/Section';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import {StrapiItem} from 'src/strapi/StrapiItem';

type EquipePlateformeProps = {
  titre: string;
  citation?: string;
  description?: string;
  liste: {
    id: number;
    titre: string;
    legende: string;
    image: StrapiItem;
  }[];
  cta_contact: string;
};

const EquipePlateforme = ({
  titre,
  citation,
  description,
  liste,
  cta_contact,
}: EquipePlateformeProps) => {
  return (
    <Section>
      <h2 className="md:text-center mb-1">{titre}</h2>
      {citation && (
        <h4 className="text-primary-7 md:text-center text-[24px] leading-[32px] mb-1">
          {citation}
        </h4>
      )}
      {description && (
        <p className="text-primary-10 md:text-center md:text-[18px] leading-[30px] mb-0">
          {description}
        </p>
      )}
      <div className="flex gap-4 flex-wrap justify-center my-12">
        {liste.map(l => (
          <div
            key={l.id}
            className="w-[169px] h-[195px] border border-primary-5 rounded-[10px] flex flex-col items-center justify-start gap-4 py-4 px-2"
          >
            <StrapiImage
              data={l.image}
              className="rounded-full w-[83px] h-[83px] border border-primary-4"
            />
            <div className="flex flex-col gap-1">
              <p className="text-primary-9 text-[14px] text-center leading-[19px] font-[500] mb-0">
                {l.titre}
              </p>
              <p className="text-primary-6 text-[12px] text-center leading-[16px] font-[500] mb-0">
                {l.legende}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-8 justify-center">
        <ButtonWithLink href="/contact" size="big">
          {cta_contact}
        </ButtonWithLink>
      </div>
    </Section>
  );
};

export default EquipePlateforme;
