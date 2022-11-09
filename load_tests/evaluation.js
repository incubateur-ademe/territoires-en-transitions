import http from 'k6/http';
import {sleep, check} from 'k6';

export const options = {
  stages: [
    {duration: '5m', target: 10}, // simulate ramp-up of traffic from 1 to 100 users over 5 minutes.
    {duration: '10m', target: 10}, // stay at 100 users for 10 minutes
    {duration: '5m', target: 0}, // ramp-down to 0 users
  ],

  thresholds: {
    // 99% of requests must complete below 1.5s
    http_req_duration: ['p(99)<1500'],
  },
};

function random(array) {
  return array[Math.floor((Math.random() * array.length))];
}

/**
 * Load test
 * Se connecte en tant qu'utilisateur puis écrit des statuts,
 * ce qui cause des appels au business pour calculer les scores.
 */
export default function() {
  // Se connecte en tant qu'utilisateur
  const loginUrl = `${__ENV.SUPABASE_URL}/auth/v1/token?grant_type=password`;
  const loginParams = {
    headers: {
      'apikey': __ENV.SUPABASE_KEY,
      'Content-Type': 'application/json',
    },
  };
  const credentials = JSON.stringify({
    'email': __ENV.EMAIL,
    'password': __ENV.PASSWORD,
  });

  const loginResponse = http.post(loginUrl, credentials, loginParams);
  check(loginResponse, {
    'logged in successfully': (resp) => resp.json('access_token') !== '',
  });
  const userToken = loginResponse.json('access_token');

  // Upsert des statuts
  const statutUrl = `${__ENV.SUPABASE_URL}/rest/v1/action_statut?on_conflict=collectivite_id,action_id`;
  const upsertParams = {
    headers: {
      'apikey': __ENV.SUPABASE_KEY,
      'Authorization': `Bearer ${userToken}`,
      'prefer': 'resolution=merge-duplicates',
      'Content-Type': 'application/json',
    },
  };

  // pour chaque referentiel
  const collectivite_id = parseInt(__ENV.COLLECTIVITE_ID);
  for (let ref of referentielsTaches) {
    for (let i = 0; i < 5; i++) {
      const action_id = random(ref.action_id);
      const statut = JSON.stringify({
        'collectivite_id': collectivite_id,
        'action_id': action_id,
        'avancement': 'detaille',
        'avancement_detaille': [0.2, 0.5, 0.3],
        'concerne': true,
      });
      const upsertResponse = http.post(statutUrl, statut, upsertParams);
      check(upsertResponse, {
        'statut updated successfully': (resp) => resp.status === 201,
      });
      if (upsertResponse.status !== 201) console.log(upsertResponse.body);
      sleep(1);
    }
  }
}

const referentielsTaches =
  [
    {
      'referentiel': 'eci',
      'action_id': [
        'eci_1.1.1.1',
        'eci_1.1.1.2',
        'eci_1.1.1.3',
        'eci_1.1.2.1',
        'eci_1.1.2.2',
        'eci_1.1.2.3',
      ],
    },
    {
      'referentiel': 'cae',
      'action_id': [
        'cae_1.1.1.3.1',
        'cae_1.1.1.3.2',
        'cae_1.1.1.3.3',
        'cae_1.1.1.4.1',
        'cae_1.1.1.4.2',
        'cae_1.1.1.4.3',
      ],
    },
  ];
