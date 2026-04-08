import { InfoTooltip } from '@tet/ui';
import DOMPurify from 'dompurify';
import { Justification } from './justification';
import { QuestionActionsLiees } from './question-actions-liees';
import { QuestionReponseProps } from './question-reponse-props.types';
import { reponseParType } from './reponse';

/** Affiche une question avec sa réponse et son éventuel libellé d'aide */
export const QuestionReponse = (props: QuestionReponseProps) => {
  const { question, reponse } = props;
  const { id, type, formulation, description, actionIds } = question;
  const Reponse = reponseParType[type];

  return (
    <div
      className="flex flex-col bg-white border rounded-md p-4 gap-2"
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
