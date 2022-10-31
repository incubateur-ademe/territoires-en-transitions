import http from 'k6/http';
import {check, sleep} from 'k6';

export const options = {
  // 1 user looping for 1 minute
  vus: 1,
  duration: '1m',

  thresholds: {
    // 99% of requests must complete below 1.5s
    http_req_duration: ['p(99)<1500'],
  },
};

/**
 * Smoke test
 * Se connecte en tant qu'utilisateur puis récupère ses DCPs.
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

  // Récupère les DCPs.
  const getParams = {
    headers: {
      'apikey': __ENV.SUPABASE_KEY,
      'Authorization': `Bearer ${userToken}`,
      'prefer': 'resolution=merge-duplicates',
      'Content-Type': 'application/json',
    },
  };
  const dcpUrl = `${__ENV.SUPABASE_URL}/rest/v1/dcp`;

  const dcps = http.get(dcpUrl, getParams).json();
  check(dcps, {
    'retrieved DCP': (dcps) =>
      dcps[0]['email'] === __ENV.EMAIL &&
      dcps.length === 1,
  });

  sleep(1);
}
