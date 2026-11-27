# Image du job de rafraîchissement du miroir de la prod (refresh-prod-mirror.sh).
# Client Postgres de la version de la RDB stats, curl pour le bucket d'export.
FROM postgres:17

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY refresh-prod-mirror.sh /usr/local/bin/refresh-prod-mirror.sh

USER postgres
ENTRYPOINT ["/usr/local/bin/refresh-prod-mirror.sh"]
