'use client';

import Markdown from '../../components/markdown/Markdown';
import { Alert } from '@tet/ui';

export type InfoTvaProps = {
  titre: string;
  description: string;
};

const InfoTva = ({ titre, description }: InfoTvaProps) => {
  return (
    <Alert
      className="p-3 mt-10 rounded-[10px]"
      title={titre}
      description={
        <Markdown
          texte={description}
          className="paragraphe-14 paragraphe-info-1 paragraphe-medium -mb-6 [&>p]:mb-0"
        />
      }
    />
  );
};

export default InfoTva;
