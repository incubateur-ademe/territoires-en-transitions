#!/usr/bin/env bash
set -euo pipefail

excluded_containers="${1:?Missing excluded containers}"
network_id="${2:?Missing Docker network}"
prefetch_pid=''

# The CLI pulls Postgres first, then the other images one at a time. Prefetch
# those services while Postgres downloads and starts. Keep image versions and
# registry mapping aligned with the installed CLI; do not pull Postgres twice.
# Local act runs already have their images and need no additional tooling.
if [[ -z "${ACT:-}" ]]; then
  (
    supabase services --output json |
      jq -r \
        --arg excluded "$excluded_containers" \
        --arg registry "${SUPABASE_INTERNAL_IMAGE_REGISTRY:-public.ecr.aws}" '
          ($excluded | split(",")) as $excluded_services |
          ($registry | ascii_downcase) as $registry |
          .[] |
          (.name | split("/") | last) as $service |
          select($service != "postgres" and ($excluded_services | index($service) | not)) |
          if $registry == "docker.io" then "\(.name):\(.local)"
          else "\($registry)/supabase/\($service):\(.local)" end
        ' |
      xargs -r -P 3 -n 1 bash -c '
        docker image inspect "$1" >/dev/null 2>&1 || docker pull --quiet "$1"
      ' _
  ) &
  prefetch_pid=$!
fi

# On failure the CLI removes its containers but keeps the restored db volume, so
# a new attempt starts from the same backup without restarting the whole job.
max_attempts=3
for attempt in $(seq 1 "$max_attempts"); do
  start_status=0
  supabase start --exclude "$excluded_containers" --network-id "$network_id" || start_status=$?
  if [[ "$start_status" -eq 0 || "$attempt" -eq "$max_attempts" ]]; then
    break
  fi
  echo "::warning::supabase start failed (attempt $attempt/$max_attempts), retrying."
  ss -tanp 2>/dev/null | grep -E ':5432[1-9]\b' || true
  sleep 15
done

# Prefetching is optional: the CLI still pulls missing images with its normal
# retries and checks service health. Always preserve the startup exit status.
if [[ -n "$prefetch_pid" ]] && ! wait "$prefetch_pid"; then
  echo '::warning::Supabase image prefetch failed; startup used the CLI image pull fallback.'
fi

exit "$start_status"
