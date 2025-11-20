#!/bin/sh

###
### Run the react-email dev preview server
###

PORT=3030
TMP_DIR=/tmp/react-email
SRC_DIR=$(pwd)/apps/backend

# create target dir for symlinks
mkdir -p "${TMP_DIR}"
mkdir -p "${TMP_DIR}/@/backend/utils"

# create symlink on the notification shared components sources
ln -sf "${SRC_DIR}/src/utils/notifications" "${TMP_DIR}/@/backend/utils"

# create symlink on all email template/props found into the backend
find "${SRC_DIR}" -name "*.email.tsx" -exec ln -sf {} "${TMP_DIR}" ';'
find "${SRC_DIR}" -name "*.props.ts" -exec ln -sf {} "${TMP_DIR}" ';'

# start the dev server
pnpm email dev -d "${TMP_DIR}" -p ${PORT}
