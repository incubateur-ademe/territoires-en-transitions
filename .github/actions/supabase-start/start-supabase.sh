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

start_status=0
supabase start --exclude "$excluded_containers" --network-id "$network_id" || start_status=$?

# Prefetching is optional: the CLI still pulls missing images with its normal
# retries and checks service health. Always preserve the startup exit status.
if [[ -n "$prefetch_pid" ]] && ! wait "$prefetch_pid"; then
  echo '::warning::Supabase image prefetch failed; startup used the CLI image pull fallback.'
fi

exit "$start_status"
