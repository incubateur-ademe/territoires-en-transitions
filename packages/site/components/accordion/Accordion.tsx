'use client';

import {useState} from 'react';
import classNames from 'classnames';
import Markdown from '@components/markdown/Markdown';

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

  const contentClassName = classNames({
    'fr-collapse--expanded py-3 px-4': expanded,
    'fr-collapse': !expanded,
  });

  return (
    <div className="fr-accordion">
      <h6 className="fr-accordion__title">
        <button
          className="fr-accordion__btn bg-white text-primary-9 text-[18px] leading-[22px] font-bold"
          aria-controls={id}
          aria-expanded={expanded}
          onClick={() => setExpanded(prevState => !prevState)}
        >
          {title}
        </button>
      </h6>
      <div className={contentClassName} id={id}>
        {typeof content === 'string' ? (
          <Markdown texte={content} className="paragraphe-16" />
        ) : (
          content
        )}
      </div>
    </div>
  );
};

export default Accordion;
