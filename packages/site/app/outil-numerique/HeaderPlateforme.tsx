/* eslint-disable react/no-unescaped-entities */
import ButtonWithLink from '@components/dstet/buttons/ButtonWithLink';
import PlayCircleIcon from '@components/icones/PlayCircleIcon';
import Section from '@components/sections/Section';

const HeaderPlateforme = () => {
  return (
    <Section containerClassName="bg-gradient-to-b from-[#F4F5FD] to-[#FFFFFF]">
      <h1 className="text-primary-9 text-center text-[52px] leading-[72px]">
        Vous cherchez un outil pour piloter vos plans d’action et suivre vos
        indicateurs ?
      </h1>
      <p className="text-primary-7 text-center text-[21px] leading-[29px] font-bold">
        Découvrez ce service gratuit dédié à accompagner votre collectivité !
      </p>
      <div className="flex gap-8 justify-center">
        <ButtonWithLink
          href="https://app.territoiresentransitions.fr/auth/signup"
          size="big"
        >
          Je m'inscris
        </ButtonWithLink>
        <ButtonWithLink
          href="https://calendly.com/territoiresentransitions"
          size="big"
          variant="outlined"
        >
          <div className="flex gap-3 justify-center items-center">
            <PlayCircleIcon fill="#6A6AF4" /> Je participe à une démo
          </div>
        </ButtonWithLink>
      </div>
    </Section>
  );
};

export default HeaderPlateforme;
