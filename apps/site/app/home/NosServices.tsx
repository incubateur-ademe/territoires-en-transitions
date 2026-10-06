import Section from '@/site/components/sections/Section';
import { TitreSection } from '@/site/components/sections/TitreSection';
import { isPcaetLaunched } from '@/site/src/utils/is-pcaet-launched';
import { Badge, Button } from '@tet/ui';
import Image from 'next/image';

export const NosServices = async () => {
  const pcaetLaunched = await isPcaetLaunched();

  return (
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
            Le programme Territoire Engagé Transition Écologique (TETE)
          </h3>
          <p>
            Planifiez et structurez votre transition écologique, accompagné par
            un expert. Le programme de référence pour les collectivités,
            notamment les EPCI, avec un accompagnement personnalisé pour
            mobiliser vos équipes.
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
            Une plateforme gratuite pour piloter vos plans
          </h3>
          <p>
            Situez votre collectivité dans sa transition écologique, définissez
            des plans d’actions personnalisés et pilotez vos projets au même
            endroit.
          </p>
          <Button variant="outlined" href="/plateforme-numerique">
            Découvrir la plateforme
          </Button>
        </div>
      </div>

      {pcaetLaunched && (
        <div className="flex flex-col lg:flex-row-reverse gap-4 lg:gap-24 items-center lg:items-start">
          <Image
            src="/pictogrammes/demarche-pcaet.svg"
            alt=""
            width={357}
            height={309}
          />
          <div className="px-4">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge title="Nouveau" variant="new" size="sm" />
              <Badge title="Dépôt réglementaire" variant="info" size="sm" />
            </div>
            <h3 className="font-bold text-primary-10 text-2xl">
              Votre PCAET, de l’élaboration à l’adoption
            </h3>
            <p>
              Que votre démarche soit obligatoire ou volontaire, constituez
              votre dossier en équipe, transmettez-le pour avis et suivez son
              avancement.
            </p>
            <Button variant="primary" href="/demarche-pcaet">
              Découvrir la démarche PCAET
            </Button>
          </div>
        </div>
      )}
    </Section>
  );
};
