import Section from '@/site/components/sections/Section';
import { Badge, Icon } from '@tet/ui';
import Image from 'next/image';
import { DepotDemo } from './depot-demo/depot-demo';

export const DemarchePcaetDemoSection = () => (
  <Section containerClassName="bg-primary-1 lg:!py-20" className="gap-12">
    <div className="flex flex-col items-center gap-5 text-center max-w-4xl mx-auto">
      <h2 className="mb-0 text-primary-9 text-2xl lg:text-[1.875rem] leading-tight">
        Comment élaborer votre PCAET <br className="max-lg:hidden" />
        sur Territoires en Transitions&nbsp;?
      </h2>
      <p className="mb-0 text-primary-10 lg:text-lg">
        En constituant votre dossier directement sur la plateforme, vous{' '}
        <strong>centralisez vos données et vos documents</strong>, transmettez
        automatiquement votre dossier{' '}
        <strong>pour avis au préfet de région et au conseil régional</strong>,
        et <strong>pilotez votre plan d&apos;actions</strong> tout au long de la
        vie de votre PCAET. Découvrez{' '}
        <strong>l&apos;ensemble du parcours en action</strong>, de l&apos;ajout
        des documents à l&apos;adoption du plan.
      </p>
    </div>

    <DepotDemo />

    {/* Même largeur que la scène de la démo (1200 px au plus, centrée). */}
    <div className="w-full max-w-[1200px] mx-auto mt-4 flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-16 p-4 lg:px-8 lg:py-6 bg-white border border-primary-3 rounded-lg">
      <div className="flex flex-col gap-3 lg:flex-1">
        <Badge
          title="Focus sur : Import automatique"
          variant="high"
          size="sm"
        />
        <h3 className="mb-0 text-primary-9 text-[17px] lg:text-[19px] leading-snug">
          Ne rédigez plus votre programme d&apos;actions deux fois
        </h3>
        <p className="mb-0 leading-relaxed text-primary-10 max-lg:text-[15px]">
          Quel que soit son format (PDF, Word ou Excel), importez votre
          programme d&apos;actions : en quelques minutes, la plateforme en
          reprend les actions pour constituer votre programme, prêt à être
          piloté. Plus besoin de tout ressaisir.
        </p>
      </div>
      <div aria-hidden className="flex flex-wrap items-center gap-2.5 shrink-0">
        <Image src="/files-icons.svg" alt="" width={125} height={75} />
        <Icon icon="arrow-right-line" className="text-primary-9" />
        <span className="px-2.5 py-1.5 bg-primary-9 rounded-md text-xs font-bold text-white">
          Programme d&apos;actions
        </span>
      </div>
    </div>
  </Section>
);
