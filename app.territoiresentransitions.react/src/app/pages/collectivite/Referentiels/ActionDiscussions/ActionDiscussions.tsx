import {useState} from 'react';
import classNames from 'classnames';
import ActionDiscussionsHeader from './ActionDiscussionsHeader';
import ActionDiscussionsFeed from './ActionDiscussionsFeed';

export type TVue = 'ouverts' | 'fermer';

const ActionDiscussions = () => {
  /** Gère l'affichage du panneau de discussions */
  const [isOpen, setIsOpen] = useState(false);

  /** Gère la vu discussions "ouvertes" ou "fermer" */
  const [vue, setVue] = useState<TVue>('ouverts');
  const changeVue = (vue: TVue) => setVue(vue);

  return (
    <>
      {/** Toggle button */}
      <div className="hidden lg:block absolute top-6 right-6 border border-gray-200">
        <button
          className={classNames('p-2 text-bf500', {
            'fr-fi-chat-quote-line': !isOpen,
            'fr-fi-chat-quote-fill bg-gray-200': isOpen,
          })}
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>
      {/** Panneau de discussion */}
      <div
        className={classNames('border-l w-full max-w-md border-l-gray-200', {
          hidden: !isOpen,
          block: isOpen,
        })}
      >
        <ActionDiscussionsHeader
          closeActionDiscussions={() => setIsOpen(false)}
          vue={vue}
          changeVue={changeVue}
        />
        <ActionDiscussionsFeed vue={vue} />
      </div>
    </>
  );
};

export default ActionDiscussions;
