import Section from '@/site/components/sections/Section';
import { TitreSection } from '@/site/components/sections/TitreSection';
import { isPcaetLaunched } from '@/site/src/utils/is-pcaet-launched';
import { Badge, Button } from '@tet/ui';
import classNames from 'classnames';
import Image from 'next/image';
import { ReactNode } from 'react';

export const NosServices = async () => {
  const pcaetLaunched = await isPcaetLaunched();

  return (
    <Section
      className="!gap-12 lg:!gap-10"
      containerClassName="bg-primary-0 max-md:!py-10 md:max-lg:!py-14 lg:!py-20"
    >
      <TitreSection className="!mb-0">Nos services</TitreSection>

      <Service
        image={
          <Image
            src="/pictogrammes/programme.svg"
            alt=""
            width={428}
            height={371}
            className="w-full max-w-[360px] h-auto"
          />
        }
        imagePosition="right"
        titre="Le programme Territoire Engagé Transition Écologique (TETE)"
        description="Planifiez et structurez votre transition écologique, accompagné par un expert. Le programme de référence pour les collectivités, notamment les EPCI, avec un accompagnement personnalisé pour mobiliser vos équipes."
        action={
          <Button variant="outlined" href="/programme">
            Découvrir le programme
          </Button>
        }
      />

      <Service
        image={
          <Image
            src="/pictogrammes/plateforme-numerique.svg"
            alt=""
            width={422}
            height={328}
            className="w-full max-w-[420px] h-auto"
          />
        }
        imagePosition="left"
        titre="Une plateforme gratuite pour piloter vos plans"
        description="Situez votre collectivité dans sa transition écologique, définissez des plans d’actions personnalisés et pilotez vos projets au même endroit."
        action={
          <Button variant="outlined" href="/plateforme-numerique">
            Découvrir la plateforme
          </Button>
        }
      />

      {pcaetLaunched && (
        <Service
          image={
            <Image
              src="/visuel-demarche-pcaet.png"
              alt=""
              width={1004}
              height={787}
              className="w-full max-w-[530px] h-auto"
            />
          }
          imagePosition="right"
          badges={
            <>
              <Badge title="Nouveau" variant="new" size="sm" />
              <Badge title="Dépôt réglementaire" variant="info" size="sm" />
            </>
          }
          titre="Votre PCAET, de l’élaboration à l’adoption"
          description="Que votre démarche soit obligatoire ou volontaire, constituez votre dossier en équipe, transmettez-le pour avis et suivez son avancement."
          action={
            <Button variant="primary" href="/demarche-pcaet">
              Découvrir la démarche PCAET
            </Button>
          }
        />
      )}
    </Section>
  );
};

const Service = ({
  image,
  imagePosition,
  badges,
  titre,
  description,
  action,
}: {
  image: ReactNode;
  imagePosition: 'left' | 'right';
  badges?: ReactNode;
  titre: string;
  description: string;
  action: ReactNode;
}) => (
  <div className="grid lg:grid-cols-2 gap-6 lg:gap-16 items-center">
    <div
      className={classNames('flex justify-center', {
        'lg:order-last': imagePosition === 'right',
      })}
    >
      {image}
    </div>
    <div className="flex flex-col items-start gap-4 max-w-xl">
      {badges && <div className="flex flex-wrap gap-2">{badges}</div>}
      <h3 className="m-0 font-bold text-primary-10 text-2xl">{titre}</h3>
      <p className="m-0">{description}</p>
      <div className="mt-2">{action}</div>
    </div>
  </div>
);
