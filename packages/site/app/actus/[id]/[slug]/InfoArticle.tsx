'use client';

import {useEffect, useState} from 'react';
import {processMarkedContent} from 'src/utils/processMarkedContent';

type InfoArticleProps = {
  texte: string;
};

const InfoArticle = ({texte}: InfoArticleProps) => {
  const [processedText, setProcessedText] = useState<string>('');

  const processContent = async (texte: string) => {
    const newText = await processMarkedContent(texte);
    setProcessedText(newText);
  };

  useEffect(() => {
    if (texte) processContent(texte);
  }, [texte]);

  return (
    <div
      className="fr-callout w-full bg-[#f5f5fe] my-8"
      style={{
        boxShadow: 'inset 0.25rem 0 0 0 #000091',
      }}
      dangerouslySetInnerHTML={{
        __html: processedText,
      }}
    />
  );
};

export default InfoArticle;
