#!/bin/bash

# setup networking
mode=${NETWORK_MODE:-host}
log "container is running OSTYPE ${OSTYPE}"
if [ "${OSTYPE}" == "linux-musl" ]; then
  hostname_output=$(hostname -i | awk '{ print $1 }')
else
  hostname_output=$(hostname -I | awk '{ print $1 }')
fi

log "hostname being added is ${hostname_output}"

if [[ $mode == "bridge" ]]; then
  # make a call to to envoy container to register ip
  # retry till success or timeout
  curl --no-progress-meter \
    --connect-timeout 2 \
    --retry 100 \
    --retry-delay 0 \
    --retry-max-time 100 \
    --retry-connrefused \
    -o /dev/null \
    -X POST \
    -H "Content-Type: text/plain" \
    -d "${hostname_output}" \
    http://${ALFRED_ENVOY_CONFIG_HOST}:${ALFRED_ENVOY_CONFIG_PORT}
fi

exec pnpm run dockerstart
