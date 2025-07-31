import { CrispSession } from '../../../crisp/models/get-crisp-session.response';

export const crispSessionSample: CrispSession = {
  session_url:
    'https://app.crisp.chat/website/582ff50a-5ac4-4f38-a8bc-62f51beeef89/inbox/session_b27f1426-8400-469a-afe0-5e19eeb7eb59',
  session_id: 'session_b27f1426-8400-469a-afe0-5e19eeb7eb59',
  website_id: '582ff50a-5ac4-4f38-a8bc-62f51beeef89',
  availability: 'offline',
  created_at: 1734340847966,
  is_blocked: false,
  mentions: [],
  meta: {
    nickname: 'TEULIER Mathieu',
    email: 'mathieu.teulier@ademe.fr',
    phone: '',
    avatar: '',
    ip: '40.93.76.24',
    data: {
      'ticket-url':
        'https://www.notion.so/Erreur-page-Site-Territoiresentransitions-1616523d57d781e5a30de919d83bdd4b',
    },
    device: {
      geolocation: {
        country: 'FR',
        coordinates: {
          latitude: 46.2276,
          longitude: 2.2137,
        },
      },
      locales: ['fr'],
      system: {
        os: {},
        engine: {},
        browser: {},
        useragent: 'Email',
      },
    },
    segments: ['email', 'bug'],
    subject: 'Erreur page Site Territoiresentransitions',
  },
  participants: [
    {
      type: 'email',
      target: 'sandrine.prouteau@ademe.fr',
    },
  ],
  state: 'resolved',
  status: 2,
  unread: {
    operator: 0,
    visitor: 0,
  },
  updated_at: 1734442624170,
  people_id: '8792feba-d1e9-4004-9522-c93fb40b9c4c',
  last_message:
    'Salut,  Je vois que c’est réglé. Merci ☺  Bonne après-midi,  Mathieu TEULIER Partenariats et Territoires Service des Politiques Territoriales (SPoT)  ADEME – 20 avenue du Grésillé – BP 90406 – 49004[..]',
  preview_message: {
    type: 'text',
    from: 'user',
    excerpt:
      'Salut,  Je vois que c’est réglé. Merci ☺  Bonne après-midi,  Mathieu TEULIER Partenariats et Territoires Service des Politiques Territoriales (SPoT)  ADEME – 20 avenue du Grésillé – BP 90406 – 49004[..]',
    fingerprint: 173444262405560,
  },
  compose: {
    operator: {
      'cf71d595-1170-4bd1-8fc8-5108fe202801': {
        type: 'start',
        timestamp: 1734357608712,
        excerpt:
          "Ma collegue du service technique s'en est occupé. Donc a priori tout devrait être bon d'ici la fin de journée. Pourriez-vous revenir vers moi demain si le problème persiste ?",
        user: {
          nickname: 'Benjamin Goullard',
          user_id: 'cf71d595-1170-4bd1-8fc8-5108fe202801',
        },
      },
      '21a21e4b-7cf6-41c6-b967-48a1375678bf': {
        type: 'stop',
        timestamp: 1734422188263,
        excerpt: null,
        user: {
          nickname: 'Manon Bouvier',
          user_id: '21a21e4b-7cf6-41c6-b967-48a1375678bf',
        },
      },
      '1d7f4c4a-ad9e-43c0-9cf5-d2ad65b0cc6f': {
        type: 'start',
        timestamp: 1734507484413,
        excerpt: null,
        user: {
          nickname: 'Marc Rutkowski',
          user_id: '1d7f4c4a-ad9e-43c0-9cf5-d2ad65b0cc6f',
        },
      },
    },
  },
  assigned: {
    user_id: '21a21e4b-7cf6-41c6-b967-48a1375678bf',
  },
  active: {
    now: false,
  },
};
