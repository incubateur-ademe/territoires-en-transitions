/* eslint-disable react/no-unescaped-entities */
import ButtonWithLink from '@components/dstet/buttons/ButtonWithLink';
import Section from '@components/sections/Section';

const EquipePlateforme = () => {
  return (
    <Section>
      <h2 className="text-center mb-1">Qui sommes-nous ?</h2>
      <h4 className="text-primary-7 text-center text-[24px] leading-[32px] mb-1">
        “Dans un environnement qui change, il n'y a pas de plus grand risque que
        de rester immobile.”
      </h4>
      <p className="text-primary-10 text-center text-[18px] leading-[30px]">
        C’est avec cette envie de faire avancer les choses que le projet
        Territoires en Transitions est né. Nicolas Vallée, intrapreneur et
        salarié de l’ADEME, a toujours aimé faire bouger les lignes. C’est donc
        dans cette optique qu’il s’est entouré des meilleurs (évidemment) pour
        atteindre un objectif : changer le monde. Enfin, déjà changer le
        quotidien des collectivités pour leur permettre de réussir leur
        transition écologique.
      </p>
      <div></div>
      <div className="flex gap-8 justify-center">
        <ButtonWithLink href="/contact" size="big">
          Je contacte l'équipe
        </ButtonWithLink>
      </div>
    </Section>
  );
};

export default EquipePlateforme;
