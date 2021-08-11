#!/bin/sh

echo "$FLAVOR"
npm run build-$FLAVOR
serve -s build
