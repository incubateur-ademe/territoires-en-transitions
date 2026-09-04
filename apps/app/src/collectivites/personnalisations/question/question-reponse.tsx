import { cn, InfoTooltip } from '@tet/ui';
import DOMPurify from 'dompurify';
import { useEffect, useRef } from 'react';
import { Justification } from './justification';
import { QuestionActionsLiees } from './question-actions-liees';
import { QuestionReponseProps } from './question-reponse-props.types';
import { reponseParType } from './reponse';

/** Affiche une question avec sa réponse et son éventuel libellé d'aide */
export const QuestionReponse = ({
  isHighlighted = false,
  ...props
}: QuestionReponseProps & { isHighlighted?: boolean }) => {
  const { question, reponse } = props;
  const { id, type, formulation, description, actionIds } = question;
  const Reponse = reponseParType[type];

  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isHighlighted) return;

    // Le défilement doit résister à la restauration de scroll de Next (qui
    // remet la nouvelle page en haut) et au décalage de mise en page pendant
    // le chargement des questions. On ré-affirme donc la position sur
    // plusieurs frames, en s'arrêtant si l'utilisateur prend la main.
    let userScrolled = false;
    const markScrolled = () => {
      userScrolled = true;
    };
    window.addEventListener('wheel', markScrolled, { passive: true });
    window.addEventListener('touchmove', markScrolled, { passive: true });
    window.addEventListener('keydown', markScrolled, { passive: true });
    window.addEventListener('pointerdown', markScrolled, { passive: true });

    const scrollToQuestion = () => {
      if (userScrolled) return;
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    const raf = requestAnimationFrame(scrollToQuestion);
    const timeouts = [150, 400, 800].map((delay) =>
      setTimeout(scrollToQuestion, delay)
    );

    return () => {
      cancelAnimationFrame(raf);
      timeouts.forEach(clearTimeout);
      window.removeEventListener('wheel', markScrolled);
      window.removeEventListener('touchmove', markScrolled);
      window.removeEventListener('keydown', markScrolled);
      window.removeEventListener('pointerdown', markScrolled);
    };
  }, [isHighlighted]);

  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col bg-white border rounded-md p-4 gap-2',
        isHighlighted && 'border-primary-7 bg-primary-0'
      )}
      id={`q-${id}`}
    >
      <div className="flex flex-row justify-between items-center my-2">
        <div className="flex flex-row items-center gap-2">
          <legend
            className="text-primary-10"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(formulation),
            }}
          />
          {description && (
            <InfoTooltip
              className="max-w-lg"
              label={
                <span
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(description),
                  }}
                />
              }
            />
          )}
        </div>
        <Reponse key={`${id}${reponse ? '' : '-loading'}`} {...props} />
      </div>
      <Justification {...props} />
      {!!actionIds?.length && <QuestionActionsLiees {...props} />}
    </div>
  );
};
