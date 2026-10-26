#!/bin/bash

set -euo pipefail

if (( $# != 2 )) || [[ -z "$1" || -z "$2" ]]; then
  echo 'sqitch-local requires a non-empty command and target' >&2
  exit 2
fi

# Split the command input into an array by space
IFS=' ' read -r -a cmd_array <<< "$1"
if (( ${#cmd_array[@]} == 0 )); then
  echo 'sqitch-local command cannot be empty' >&2
  exit 2
fi

# Execute sqitch with the array
sqitch "${cmd_array[@]}" --target "$2"
