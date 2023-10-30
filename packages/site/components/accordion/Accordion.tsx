'use client';

import {useState} from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import classNames from 'classnames';

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
      <div className={contentClassName} id={id}>
        {typeof content === 'string' ? (
          <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
        ) : (
          content
        )}
      </div>
    </div>
  );
};

export default Accordion;
