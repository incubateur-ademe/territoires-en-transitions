'use client';

import { Alert } from '@tet/ui';
import Markdown from '../../components/markdown/Markdown';

export type InfoTvaProps = {
  titre: string;
  description: string;
};

const InfoTva = ({ titre, description }: InfoTvaProps) => {
  return (
    <Alert
      className="p-3 mt-10 rounded-xl"
      title={titre}
      description={
        <Markdown
          texte={description}
          className="paragraphe-14 paragraphe-info-1 paragraphe-medium [&>p]:mb-0"
        />
      }
    />
  );
};

export default InfoTva;
