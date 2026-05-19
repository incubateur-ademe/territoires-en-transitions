import Section from '@/site/components/sections/Section';
import { Button } from '@tet/ui';

export const QuiSommesNousSection = async () => {
  return (
    <Section
      className="text-center items-center"
      containerClassName="max-w-6xl mx-auto"
    >
      <h2>Qui sommes-nous ?</h2>
      <p className="text-primary-7 text-xl font-medium">
        “Dans un environnement qui change, il n&apos;y a pas de plus grand
        risque que de rester immobile.”
      </p>
      <div className="flex flex-col gap-4 [&_p]:mb-0 [&_p]:text-lg [&_p]:leading-7">
        <p>
          C&apos;est avec cette envie d&apos;offrir à toutes les collectivités
          françaises un service public numérique à la hauteur de l&apos;enjeu
          que <span className="font-bold">Territoires en Transitions</span> a vu
          le jour.
        </p>
        <p>
          Portée par l&apos;ADEME et développée au sein du programme{' '}
          <a
            href="https://www.beta.gouv.fr"
            target="_blank"
            rel="noreferrer noopener"
            className="underline text-primary-9"
          >
            beta.gouv.fr
          </a>
          , notre équipe accompagne les personnes en charge de la transition
          écologique dans leur travail quotidien.
        </p>
      </div>
      <Button
        variant="outlined"
        href="https://beta.gouv.fr/startups/territoires-en-transitions.html#equipe"
        external
        className="mt-6 after:hidden"
      >
        Découvrir les membres de l&apos;équipe
      </Button>
    </Section>
  );
};
