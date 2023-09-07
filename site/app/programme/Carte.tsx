/* eslint-disable react/no-unescaped-entities */
import ButtonWithLink from '@components/buttons/ButtonWithLink';
import Section from '@components/sections/Section';
import Slideshow from '@components/slideshow/Slideshow';

const Carte = () => {
  return (
    <Section id="carte" className="flex-col">
      <h3>De nombreuses collectivités ont déjà franchi le cap !</h3>

      <Slideshow
        className="mt-16"
        slides={[
          <CarteElement
            key="1"
            src="programme/Toutes_les_collectivites.jpg"
            titre="Toutes les collectivités"
          />,
          <CarteElement
            key="2"
            src="programme/Labellisees_climat_air_energie.jpg"
            titre="Labellisées Climat Air Énergie"
          />,
          <CarteElement
            key="3"
            src="programme/Labellisees_economie_circulaire.jpg"
            titre="Labellisées Économie Circulaire"
          />,
          <CarteElement
            key="4"
            src="programme/Signatiares_d_un_cot.jpg"
            titre="Signataires d'un COT"
          />,
        ]}
      />

      <div className="flex items-start justify-center gap-16 mt-16 flex-wrap">
        <div className="flex gap-4 items-center">
          <div className="bg-[#4D75AC] w-[40px] h-[30px] rounded-2xl"></div>
          <div className="w-[350px]">
            <strong>Collectivités engagées labellisées</strong> sur au moins un
            des 2 référentiels : Climat Air Énergie (CAE) et/ou Économie
            Circulaire (ECi)
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="bg-[#9E9E9E] w-[40px] h-[30px] rounded-2xl"></div>
          <div className="w-[350px]">
            <strong>Collectivités engagées non labellisées</strong> signataires
            d'un Contrat d'Objectif Territorial (COT)
          </div>
        </div>
      </div>

      <ButtonWithLink href="/faq" secondary className="mt-16 mx-auto">
        Lire les questions fréquentes
      </ButtonWithLink>
    </Section>
  );
};

export default Carte;

type CarteElementProps = {
  src: string;
  titre: string;
};

const CarteElement = ({src, titre}: CarteElementProps) => {
  return (
    <div className="relative">
      <picture className="absolute h-0 sm:h-[100px] md:h-[150px] lg:h-[200px]">
        <img
          src="territoire-engage.jpg"
          alt="Territoire engagé transition écologique"
          className="h-full"
        />
      </picture>
      <picture>
        <img src={src} alt={titre} />
        <div className="w-full mt-16 text-center text-xl font-bold">
          {titre}
        </div>
      </picture>
    </div>
  );
};
