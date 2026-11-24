'use client';

import CardsWrapper from '@/site/components/cards/CardsWrapper';
import Markdown from '@/site/components/markdown/Markdown';
import Section from '@/site/components/sections/Section';
import { ENV } from '@tet/api/environmentVariables';
import { Alert, Button, Icon } from '@tet/ui';

/**
 * Fichiers de la dernière release SNBC 3 importée, servis par le backend sans
 * authentification : le même millésime que la trajectoire de la plateforme.
 */
const getSnbc3FileUrl = (fichier: 'outil' | 'methodologie') =>
  `${ENV.backend_browser_url}/api/v1/trajectoires/snbc3/public/${fichier}`;

type DocumentationProps = {
  titre: string;
  description: string;
  info: string | null;
  descriptionExcel: string;
  descriptionPdf: string;
};

const Documentation = ({
  titre,
  description,
  info,
  descriptionExcel,
  descriptionPdf,
}: DocumentationProps) => {
  return (
    <Section
      containerClassName="max-md:!py-6 md:max-lg:!py-12 lg:!py-20"
      className="gap-6"
    >
      <h2 className="text-center text-primary-10 mb-0">{titre}</h2>
      <Markdown
        texte={description}
        className="text-center paragraphe-22 paragraphe-primary-9 markdown_style"
      />
      {info && <Alert description={<Markdown texte={info} />} />}
      <CardsWrapper cols={2}>
        {/* Excel */}
        <div className="p-4 md:p-6 border border-gray-3 bg-primary-0 rounded-lg flex max-md:flex-col gap-5">
          <div className="shrink-0 w-12 h-12 bg-primary-3 rounded-md flex justify-center items-center">
            <Icon icon="table-line" size="xl" className="text-primary-9" />
          </div>
          <div>
            <p className="text-base text-primary-10 mb-4">{descriptionExcel}</p>
            <Button
              variant="outlined"
              size="xs"
              href={getSnbc3FileUrl('outil')}
            >
              Télécharger le fichier Excel
            </Button>
          </div>
        </div>

        {/* PDF */}
        <div className="p-4 md:p-6 border border-gray-3 bg-primary-0 rounded-lg flex max-md:flex-col gap-5">
          <div className="shrink-0 w-12 h-12 bg-primary-3 rounded-md flex justify-center items-center">
            <Icon icon="file-2-line" size="xl" className="text-primary-9" />
          </div>
          <div>
            <p className="text-base text-primary-10 mb-4">{descriptionPdf}</p>
            <Button
              variant="outlined"
              size="xs"
              href={getSnbc3FileUrl('methodologie')}
            >
              Télécharger le PDF
            </Button>
          </div>
        </div>
      </CardsWrapper>
    </Section>
  );
};

export default Documentation;
