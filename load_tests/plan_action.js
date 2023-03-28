import http from "k6/http";
import { sleep, check } from "k6";

export const options = {
  stages: [
    // On monte à 16 utilisateurs
    // Soit 4x plus que le maximum constaté en production.
    { duration: "10s", target: 10 }, // simulate ramp-up of traffic over 5 minutes.
    { duration: "10s", target: 10 }, // stay at 16 users for 10 minutes
    { duration: "10s", target: 0 }, // ramp-down to 0 users
  ],

  thresholds: {
    // 95% of requests must complete below 1.5s
    http_req_duration: ["p(95)<1500"],
  },
};

function random(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Load test
 * Se connecte en tant qu'utilisateur puis écrit des statuts,
 * ce qui cause des appels au business pour calculer les scores.
 */
export default function () {
  // Se connecte en tant qu'utilisateur
  const loginUrl = `${__ENV.SUPABASE_URL}/auth/v1/token?grant_type=password`;
  const loginParams = {
    headers: {
      apikey: __ENV.SUPABASE_KEY,
      "Content-Type": "application/json",
    },
  };
  const credentials = JSON.stringify({
    email: __ENV.EMAIL,
    password: __ENV.PASSWORD,
  });

  const loginResponse = http.post(loginUrl, credentials, loginParams);
  check(loginResponse, {
    "logged in successfully": (resp) =>
      resp.json("access_token") && resp.json("access_token") !== "",
  });
  const userToken = loginResponse.json("access_token");

  const collectivite_id = parseInt(__ENV.COLLECTIVITE_ID);
  const rpcParams = {
    headers: {
      apikey: __ENV.SUPABASE_KEY,
      Authorization: `Bearer ${userToken}`,
      "Content-Type": "application/json",
    },
  };
  const filter = JSON.stringify({
    collectivite_id: collectivite_id,
    axes_id: null,
    pilotes: null,
    referents: null,
    statuts: null,
    niveaux_priorite: null,
  });

  const filterUrl = `${__ENV.SUPABASE_URL}/rest/v1/rpc/filter_fiches_action`;
  for (let i = 0; i < 50; i++) {
    const filterResponse = http.post(filterUrl, filter, rpcParams);
    check(filterResponse, {
      "filter successful": (resp) => resp.status === 200,
    });
    if (filterResponse.status !== 200) console.log(filterResponse.body);
  }

  const planUrl = `${__ENV.SUPABASE_URL}/rest/v1/rpc/plan_action`;
  const plan = JSON.stringify({
    id: 12,
  });

  for (let i = 0; i < 50; i++) {
    const planResponse = http.post(planUrl, plan, rpcParams);
    check(planResponse, {
      "plan successful": (resp) => resp.status === 200,
    });
    if (planResponse.status !== 200) console.log(planResponse.body);
  }
}
