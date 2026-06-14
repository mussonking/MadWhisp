#!/usr/bin/env bash
set -euo pipefail

IDENTITY_NAME="${MOTSDITS_MACOS_DEV_IDENTITY:-MotsDits Local Dev}"
KEYCHAIN_PATH="${HOME}/Library/Keychains/motsdits-dev.keychain-db"
KEYCHAIN_PASSWORD="${MOTSDITS_MACOS_DEV_KEYCHAIN_PASSWORD:-motsdits-dev}"
CERT_SUBJECT="/CN=${IDENTITY_NAME}"
TAURI_CONFIG="src-tauri/tauri.macos-dev.conf.json"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This script must run on macOS." >&2
  exit 1
fi

if [[ ! -f "${KEYCHAIN_PATH}" ]]; then
  security create-keychain -p "${KEYCHAIN_PASSWORD}" "${KEYCHAIN_PATH}"
fi

security unlock-keychain -p "${KEYCHAIN_PASSWORD}" "${KEYCHAIN_PATH}"
security set-keychain-settings -lut 21600 "${KEYCHAIN_PATH}"

CURRENT_KEYCHAINS="$(security list-keychains -d user | tr -d '"')"
if ! printf '%s\n' "${CURRENT_KEYCHAINS}" | grep -Fxq "${KEYCHAIN_PATH}"; then
  security list-keychains -d user -s "${KEYCHAIN_PATH}" ${CURRENT_KEYCHAINS}
fi

if ! security find-certificate -c "${IDENTITY_NAME}" "${KEYCHAIN_PATH}" >/dev/null 2>&1; then
  P12_PATH="$(mktemp -t motsdits-dev-cert).p12"
  P12_PASSWORD="$(openssl rand -hex 24)"
  openssl req -new -newkey rsa:2048 -x509 -sha256 -days 3650 -nodes \
    -subj "${CERT_SUBJECT}" \
    -addext "keyUsage=critical,digitalSignature" \
    -addext "extendedKeyUsage=codeSigning" \
    -keyout "${P12_PATH}.key" \
    -out "${P12_PATH}.crt"
  openssl pkcs12 -export -legacy \
    -inkey "${P12_PATH}.key" \
    -in "${P12_PATH}.crt" \
    -name "${IDENTITY_NAME}" \
    -passout "pass:${P12_PASSWORD}" \
    -out "${P12_PATH}"
  security import "${P12_PATH}" \
    -k "${KEYCHAIN_PATH}" \
    -P "${P12_PASSWORD}" \
    -T /usr/bin/codesign >/dev/null
  security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "${KEYCHAIN_PASSWORD}" "${KEYCHAIN_PATH}" >/dev/null 2>&1 || true
  rm -f "${P12_PATH}" "${P12_PATH}.key" "${P12_PATH}.crt"
fi

SIGNING_IDENTITY="$(security find-certificate -Z -c "${IDENTITY_NAME}" "${KEYCHAIN_PATH}" 2>/dev/null | sed -n 's/.*SHA-1 hash: //p' | head -1)"
if [[ -z "${SIGNING_IDENTITY}" ]]; then
  echo "Failed to resolve ${IDENTITY_NAME} signing identity from ${KEYCHAIN_PATH}." >&2
  exit 1
fi

cat > "${TAURI_CONFIG}" <<JSON
{
  "bundle": {
    "macOS": {
      "signingIdentity": "${SIGNING_IDENTITY}"
    }
  }
}
JSON

export OTHER_CODE_SIGN_FLAGS="--keychain ${KEYCHAIN_PATH}"
bunx tauri build --config "${TAURI_CONFIG}"
