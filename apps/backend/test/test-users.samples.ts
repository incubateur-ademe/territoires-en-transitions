export const YOLO_DODO = {
  id: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
  email: 'yolo@dodo.com',
  password: 'yolododo',
  collectiviteId: {
    id: 1,
    admin: 1,
    edition: 2,
  },
} as const;

export const YULU_DUDU = {
  id: '298235a0-60e7-4ceb-9172-0a991cce0386',
  email: 'yulu@dudu.com',
  password: 'yulududu',
  collectiviteId: {
    admin: 3,
  },
} as const;

// Edition on collectivités 1 and 2 (for "soi" / self-update tests)
export const YILI_DIDI = {
  id: '3f407fc6-3634-45ff-a988-301e9088096a',
  email: 'yili@didi.com',
  password: 'yilididi',
  collectiviteId: {
    edition: 1,
    edition2: 2,
  },
} as const;

// Lecture on collectivité 1
export const YALA_DADA = {
  id: '4ecc7d3a-7484-4a1c-8ac8-930cdacd2561',
  email: 'yala@dada.com',
  password: 'yaladada',
  collectiviteId: {
    lecture: 1,
  },
} as const;

// Auditeur de la collectivité 1 et 10
export const YOULOU_DOUDOU = {
  id: '5f407fc6-3634-45ff-a988-301e9088096a',
  email: 'youlou@doudou.com',
  password: 'youloudoudou',
  collectiviteId: {},
};
