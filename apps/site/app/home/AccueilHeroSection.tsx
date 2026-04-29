import { BookDemoButton } from '@/site/components/buttons/book-demo.button';
import { CreateAccountButton } from '@/site/components/buttons/create-account.button';
import Section from '@/site/components/sections/Section';
import Image from 'next/image';

const AccueilHeroSection = () => {
  return (
    <Section
      className="flex lg:!flex-row justify-between items-center gap-9"
      containerClassName="bg-primary-0 max-md:!py-6 md:max-lg:!py-12 lg:!py-20"
    >
      <div>
        <h1 className="text-primary-10 max-lg:text-center font-bold text-4xl">
          La plateforme de{' '}
          <span className="text-primary-8 underline">référence</span> pour
          piloter la transition écologique de votre territoire
        </h1>
        <p className="text-primary-7 max-lg:text-center text-2xl leading-8">
          Centralisez toutes vos actions, priorisez-les et suivez vos
          indicateurs pour atteindre vos objectifs.
        </p>

        <div className="flex flex-row flex-wrap gap-4 max-lg:justify-center">
          <CreateAccountButton />
          <BookDemoButton />
        </div>
      </div>
      <Image
        loading="eager"
        src="/visuel-plateforme.png"
        alt="Visuel plateforme"
        width={469}
        height={321}
      />
    </Section>
  );
};

export default AccueilHeroSection;
