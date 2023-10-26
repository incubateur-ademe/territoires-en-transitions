'use client';

import classNames from 'classnames';
import {useEffect, useState} from 'react';
import {processMarkedContent} from 'src/utils/processMarkedContent';

type AccordionType = {
  id: string;
  title: string;
  content: string | React.ReactNode;
  initialState?: boolean;
};

const Accordion = ({
  id,
  title,
  content,
  initialState = false,
}: AccordionType) => {
  const [expanded, setExpanded] = useState(initialState ?? false);
  const [processedContent, setProcessedContent] = useState<
    string | undefined
  >();

  const processContent = async (content: string) => {
    const newContent = await processMarkedContent(content);
    setProcessedContent(newContent);
  };

  useEffect(() => {
    if (typeof content === 'string') processContent(content);
  }, [content]);

  const contentClassName = classNames({
    'fr-collapse--expanded py-3 px-4': expanded,
    'fr-collapse': !expanded,
  });

  return (
    <div className="fr-accordion">
      <h3 className="fr-accordion__title">
        <button
          className="fr-accordion__btn nav-btn"
          aria-controls={id}
          aria-expanded={expanded}
          onClick={() => setExpanded(prevState => !prevState)}
        >
          {title}
        </button>
      </h3>
      {processedContent ? (
        <div
          className={contentClassName}
          id={id}
          dangerouslySetInnerHTML={{
            __html: processedContent,
          }}
        />
      ) : (
        <div className={contentClassName} id={id}>
          {content}
        </div>
      )}
    </div>
  );
};

export default Accordion;
