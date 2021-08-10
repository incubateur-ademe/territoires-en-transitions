const processEnv = process.env;

const backendHost =
  processEnv.NODE_ENV === "production" || processEnv.NODE_ENV === "test"
    ? window.location.host
    : "http://localhost:8000";

export const ENV = {
  node_env: process.env.NODE_ENV,
  logActionsDuration: process.env.REACT_APP_LOG_ACTION_DURATION === "TRUE",
  backendHost,
};

console.log("ENV :", JSON.stringify(ENV, null, 2));
