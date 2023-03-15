import {CSSProperties, useState} from 'react';

export type TNoticeProps = {
  message: string;
  style?: CSSProperties;
};

/**
 * Affiche un bandeau d'information
 *
 * Ref: https://www.systeme-de-design.gouv.fr/elements-d-interface/composants/bandeau-d-information-importante
 */
export const Notice = ({message, style}: TNoticeProps) => {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="fr-notice fr-notice--info" style={style}>
      <div className="fr-container">
        <div className="fr-notice__body">
          <p className="fr-notice__title">{message}</p>
          <button
            className="fr-btn--close fr-btn"
            title="Masquer le message"
            onClick={() => setVisible(false)}
          >
            Masquer le message
          </button>
        </div>
      </div>
    </div>
  );
};

/** Variante (non DSFR) du bandeau d'information */
export const NoticeAlert = ({message}: {message: string}) => (
  <Notice
    message={message}
    style={{
      backgroundColor: '#FFE8E5',
      color: '#B34000',
    }}
  />
);
