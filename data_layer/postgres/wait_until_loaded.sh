#!/bin/bash

until sh loaded.sh; do
  echo "Waiting for datalayer to be fully loaded"
  sleep 1
done

echo "Done waiting."
exit 0
