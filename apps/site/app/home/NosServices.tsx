import Section from '@/site/components/sections/Section';
import { TitreSection } from '@/site/components/sections/TitreSection';
import { Button } from '@tet/ui';
import Image from 'next/image';

export const NosServices = () => (
  <Section
    className="flex items-center gap-16"
    containerClassName="bg-primary-0 max-md:!py-6 md:max-lg:!py-12 lg:!py-20"
  >
    <TitreSection>Nos services</TitreSection>

    <div className="flex flex-col lg:flex-row-reverse gap-4 lg:gap-24 items-center lg:items-start">
      <Image
        src="/pictogrammes/programme.svg"
        alt=""
        width={357}
        height={309}
      />
      <div className="px-4">
        <h3 className="font-bold text-primary-10 text-2xl">
          Le programme Territoire Engagé Transition Écologique
        </h3>
        <p>
          Vous souhaitez planifier votre transition écologique et la structurer
          ? Vous souhaitez être accompagné par un expert ? Territoire Engagé
          Transition Écologique, c’est : le programme de référence dédié aux
          collectivités, notamment aux EPCI, pour faire de la transition
          écologique une réalité et mobiliser vos équipes avec un accompagnement
          personnalisé.
        </p>
        <Button variant="outlined" href="/programme">
          Découvrir le programme
        </Button>
      </div>
    </div>

    <div className="flex flex-col lg:flex-row gap-4 lg:gap-24 items-center lg:items-start">
      <Image
        src="/pictogrammes/plateforme-numerique.svg"
        alt=""
        width={421}
        height={360}
      />
      <div className="px-4">
        <h3 className="font-bold text-primary-10 text-2xl">
          L’outil opérationnel pour avancer de façon autonome et progressive.
        </h3>
        <p>
          Une plateforme numérique gratuite pour situer et évaluer votre
          collectivité sur l’avancée de sa transition écologique, définir des
          plans d’actions personnalisés, et piloter vos projets efficacement.
        </p>
        <Button variant="outlined" href="/outil-numerique">
          La plateforme numérique
        </Button>
      </div>{' '}
    </div>
  </Section>
);
