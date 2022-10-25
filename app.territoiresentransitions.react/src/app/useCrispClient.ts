import {useEffect} from 'react';

/** Initialise le client Crisp */
export const useCrispClient = () => {
  useEffect(() => {
    const w = window as any;
    w.$crisp = [];
    w.CRISP_WEBSITE_ID = process.env.REACT_APP_CRISP_WEBSITE_ID;
    const d = document;
    const s = d.createElement('script');
    s.src = 'https://client.crisp.chat/l.js';
    s.async = true;
    d.getElementsByTagName('head')[0].appendChild(s);
  }, []);
};
