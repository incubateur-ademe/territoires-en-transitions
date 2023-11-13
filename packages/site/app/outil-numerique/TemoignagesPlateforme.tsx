import Section from '@components/sections/Section';
import TestimonialSlideshow from '@components/slideshow/TestimonialSlideshow';

const TemoignagesPlateforme = () => {
  return (
    <Section containerClassName="bg-primary-7">
      <TestimonialSlideshow
        contenu={[
          {
            id: 1,
            auteur: 'Vincent FRISTOT',
            role: 'Adjoint au Maire chargé de l’Urbanisme et de la Transition énergétique',
            temoignage:
              'La Ville de Grenoble est clairement engagée dans la transition énergétique. Avec une culture transversale des enjeux, elle adopte des objectifs ambitieux pour la santé, l’air, l’énergie et le climat. Pour aller plus loin, elle mobilise ',
          },
        ]}
        className="rounded-[10px] w-3/4 mx-auto"
        dotsColor="orange"
        displayButtons={false}
        autoSlide
      />
    </Section>
  );
};

export default TemoignagesPlateforme;
