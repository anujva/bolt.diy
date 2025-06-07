#!/bin/bash

# log output as json so it will be parsed by elasticsearch
function log {
  echo "{\"level\": \"info\", \"msg\": \"${1}\"}"
}

# log output as json so it will be parsed by elasticsearch
function log_error {
  echo "{\"level\": \"error\", \"msg\": \"${1}\"}"
}

# Make sure the hostname can be resolved. Prevents Scala EHCache
# startup warnings like: n.s.e.Cache - Unable to set localhost. This
# prevents creation of a GUID.  Cause was: ip-172-16-13-207:
# ip-172-16-13-207: Name or service not known
grep $(hostname) /etc/hosts || echo "127.0.0.1 $(hostname)" >>/etc/hosts

# directory with secrets for local development
LOCAL_VAULT=/vault/local
# default values for the above
DEFAULT_VAULT=/vault/defaults
# temporary directory to keep secrets before exporting as environment variables
TMP_VAULT=/tmp/vault
# make sure we start with an empty directory
rm -fr ${TMP_VAULT}
mkdir ${TMP_VAULT}

# get all secrets and expose them as environment variables
log "Fetching secrets from S3"
if [ "${ALFRED_VAULT}" == "" ]; then
  ALFRED_VAULT="tt-${ALFRED_ENVIRONMENT}-alfred-vault"
fi

aws s3 sync --only-show-errors s3://${ALFRED_VAULT}/${ALFRED_APPNAME}/ ${TMP_VAULT}/

# support copying secrets from a local directory, but only in the local environment.  they supercede
# any secrets from S3
if [ "${ALFRED_ENVIRONMENT}" == "local" ]; then
  if [[ -d "${LOCAL_VAULT}" && -n "$(ls -A ${LOCAL_VAULT})" ]]; then
    log "Deploying secrets from the local vault"
    cp "${LOCAL_VAULT}"/* ${TMP_VAULT}/
  else
    if [[ -d "${DEFAULT_VAULT}" && -n "$(ls -A ${DEFAULT_VAULT})" ]]; then
      log "Deploying secrets from the default vault"
      cp "${DEFAULT_VAULT}"/* ${TMP_VAULT}/
    fi
  fi
fi

# export whatever secrets were copied to the temporary location
for secret_file in ${TMP_VAULT}/*; do
  # secret name == file name (all uppercase as it'll be exported as
  # an environment variable
  secret=$(basename ${secret_file})
  log "Exporting secret: ${secret}"
  if [ -n "${secret}" ]; then
    # read the secret
    value=$(cat ${secret_file})
    eval "export ${secret}='${value}'"
  fi
done

# clean up
rm -fr ${TMP_VAULT}

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
