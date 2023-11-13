/* eslint-disable react/no-unescaped-entities */
import Section from '@components/sections/Section';

const AvantagesPlateforme = () => {
  return (
    <Section
      containerClassName="bg-primary-1"
      className="md:!flex-row justify-center gap-32 px-24"
    >
      <div>
        <h6 className="text-primary-9 text-center text-[18px] leading-[22px] mb-0">
          Bénéficiez d’un service public et gratuit, porté et financé par
          l’ADEME
        </h6>
      </div>
      <div>
        <h6 className="text-primary-9 text-center text-[18px] leading-[22px] mb-0">
          Gérez les accès et rôles de vos collègues et partenaires
        </h6>
      </div>
      <div>
        <h6 className="text-primary-9 text-center text-[18px] leading-[22px] mb-0">
          Profitez d'une réponse à vos questions en moins de 20 minutes
        </h6>
      </div>
    </Section>
  );
};

export default AvantagesPlateforme;
