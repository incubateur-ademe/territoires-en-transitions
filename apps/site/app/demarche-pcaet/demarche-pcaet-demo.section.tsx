import Section from '@/site/components/sections/Section';
import { Badge, Icon } from '@tet/ui';
import classNames from 'classnames';
import { DemarchePcaetDemoAnime } from './demarche-pcaet.demo-anime';

const FORMATS = [
  { label: 'PDF', className: 'bg-error-1' },
  { label: 'Word', className: 'bg-info-1' },
  { label: 'Excel', className: 'bg-success-1' },
];

export const DemarchePcaetDemoSection = () => (
  <Section
    containerClassName="bg-primary-1 lg:!py-20"
    className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] gap-10 lg:gap-16 items-center"
  >
    <div className="flex flex-col gap-5">
      <h2 className="mb-0 text-primary-9 text-2xl lg:text-[1.875rem] leading-tight">
        Un dépôt intuitif de votre 1<sup>er</sup> PCAET ou d&apos;un
        renouvellement
      </h2>
      <p className="mb-0 font-bold text-primary-10 lg:text-lg">
        Le parcours vous guide document par document, et vous savez à tout
        moment ce qu&apos;il reste à fournir.
      </p>
      <div className="flex flex-col gap-2">
        <p className="mb-0 font-bold text-primary-10">
          Ce que vous pouvez faire :
        </p>
        <ul className="flex flex-col gap-1.5 m-0 pl-5 list-disc text-primary-10 lg:text-[17px]">
          <li className="p-0">
            Reprendre votre dépôt là où vous l&apos;avez laissé
          </li>
          <li className="p-0">
            Repartir de votre plan précédent pour un renouvellement
          </li>
          <li className="p-0">Inviter vos collègues à compléter le dossier</li>
        </ul>
      </div>

      <div className="flex flex-col gap-3 p-4 lg:px-[22px] lg:py-5 bg-white border border-primary-3 rounded-lg">
        <Badge title="Import évolué" variant="high" size="sm" />
        <h3 className="mb-0 text-primary-9 text-[17px] lg:text-[19px] leading-snug">
          Importez votre programme d&apos;actions existant en quelques minutes
        </h3>
        <p className="mb-0 leading-relaxed text-primary-10 max-lg:text-[15px]">
          Votre programme d&apos;actions existe déjà dans un document PDF, Word
          ou Excel ? Importez-le : la plateforme en reprend les actions pour
          constituer votre programme. Vous gagnez beaucoup de temps et évitez de
          faire le travail deux fois.
        </p>
        <div aria-hidden className="flex flex-wrap items-center gap-2.5">
          <div className="flex flex-wrap gap-1.5">
            {FORMATS.map((format) => (
              <span
                key={format.label}
                className="flex items-center gap-1.5 px-2 py-[5px] bg-white border border-primary-3 rounded-md text-xs font-bold text-primary-10"
              >
                <span
                  className={classNames('w-4 h-5 rounded-sm', format.className)}
                />
                {format.label}
              </span>
            ))}
          </div>
          <Icon icon="arrow-right-line" className="text-primary-9" />
          <span className="px-2.5 py-1.5 bg-primary-9 rounded-md text-xs font-bold text-white">
            Programme d&apos;actions
          </span>
        </div>
      </div>
    </div>

    <DemarchePcaetDemoAnime />
  </Section>
);
