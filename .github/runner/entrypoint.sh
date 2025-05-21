#!/bin/bash

if [ -z ${GH_RUNNER_TOKEN+x} ]; then
  echo "GH_RUNNER_TOKEN environment variable is not set"
  exit 1
fi

if [ -z ${GH_REPOSITORY+x} ]; then
  echo "GH_REPOSITORY environment variable is not set."
  exit 1
fi

nohup nc -lk 3000 &

/gh-runner/config.sh --url https://github.com/$GH_REPOSITORY --token $GH_RUNNER_TOKEN
/gh-runner/run.sh
