#!/usr/bin/env bash
set -Eeuo pipefail
: "${SSH_HOST:?Configura SSH_HOST}"
: "${SSH_USER:?Configura SSH_USER}"
: "${SSH_PRIVATE_KEY:?Configura SSH_PRIVATE_KEY}"
: "${SSH_KNOWN_HOSTS:?Configura SSH_KNOWN_HOSTS}"
: "${DEPLOY_PATH:?Configura DEPLOY_PATH}"
: "${VITE_API_URL:?Configura VITE_API_URL sin /api/v1}"
: "${VITE_BASE_PATH:?Configura VITE_BASE_PATH}"
: "${RUNNER_TEMP:?Falta RUNNER_TEMP}"
: "${GITHUB_SHA:?Falta GITHUB_SHA}"
: "${GITHUB_RUN_ID:?Falta GITHUB_RUN_ID}"
SSH_PORT=${SSH_PORT:-22}
[[ "$SSH_HOST" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]*$ ]]
[[ "$SSH_USER" =~ ^[a-zA-Z0-9_][a-zA-Z0-9_.-]*$ ]]
[[ "$SSH_PORT" =~ ^[0-9]+$ ]]
[[ "$DEPLOY_PATH" =~ ^/home/[a-zA-Z0-9_.-]+/proyecto2/frontend$ ]]
[[ "$VITE_BASE_PATH" =~ ^/inf513/[a-zA-Z0-9_.-]+/proyecto2/$ ]]
[[ "$VITE_API_URL" =~ ^https://[a-zA-Z0-9.-]+/inf513/[a-zA-Z0-9_.-]+/proyecto2/?$ ]] || {
  echo 'VITE_API_URL debe ser la URL del proyecto sin /api ni /api/v1.' >&2; exit 1;
}
[[ "$GITHUB_SHA" =~ ^[a-f0-9]{40}$ ]]
[[ "$GITHUB_RUN_ID" =~ ^[0-9]+$ ]]
[[ "${GITHUB_RUN_ATTEMPT:-1}" =~ ^[0-9]+$ ]]
[[ -f "$RUNNER_TEMP/frontend.tar.gz" ]]
release_id="tecnoweb-$GITHUB_SHA-$GITHUB_RUN_ID-${GITHUB_RUN_ATTEMPT:-1}"
ssh_dir=$(mktemp -d)
trap 'rm -rf -- "$ssh_dir"' EXIT
chmod 700 "$ssh_dir"

# Verificar la API real antes de reemplazar la prueba.
curl --fail --silent --show-error --connect-timeout 20 --max-time 30 \
  -H 'Accept: application/json' "${VITE_API_URL%/}/api/v1/publico/facultades" \
  -o "$ssh_dir/api-check.json"
node --input-type=module -e 'import fs from "node:fs"; const data=JSON.parse(fs.readFileSync(process.argv[1], "utf8")); if (!data || typeof data !== "object") process.exit(1)' "$ssh_dir/api-check.json"

printf '%s\n' "$SSH_PRIVATE_KEY" | tr -d '\r' > "$ssh_dir/key"
printf '%s\n' "$SSH_KNOWN_HOSTS" > "$ssh_dir/known_hosts"
chmod 600 "$ssh_dir/key" "$ssh_dir/known_hosts"
options=(-i "$ssh_dir/key" -o IdentitiesOnly=yes -o BatchMode=yes
  -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$ssh_dir/known_hosts"
  -o ConnectTimeout=20)
target="$SSH_USER@$SSH_HOST"
ssh "${options[@]}" -p "$SSH_PORT" "$target" "mkdir -p '$DEPLOY_PATH/releases'"
scp "${options[@]}" -P "$SSH_PORT" "$RUNNER_TEMP/frontend.tar.gz" \
  "$target:$DEPLOY_PATH/releases/$release_id.tar.gz"
ssh "${options[@]}" -p "$SSH_PORT" "$target" \
  "bash -s -- '$DEPLOY_PATH' '$release_id'" <<'REMOTE'
set -Eeuo pipefail
root=$1
release_id=$2
project="${root%/frontend}"
release="$root/releases/$release_id"
[[ "$project" != "$root" && ! -e "$release" ]]
mkdir -p "$release"
tar -xzf "$root/releases/$release_id.tar.gz" -C "$release"
rm -- "$root/releases/$release_id.tar.gz"
[[ -f "$release/index.html" && -d "$release/assets" && -f "$release/favicon.svg" ]]
[[ -f "$release/.project.htaccess" ]]
[[ ! -e "$root/current" || -L "$root/current" ]]
if [[ -e "$project/.htaccess" || -L "$project/.htaccess" ]]; then
  [[ ! -L "$project/.htaccess" ]] && grep -qFx '# proyecto2-api-routing-v1' "$project/.htaccess" || {
    echo 'El .htaccess existente no pertenece al despliegue. Revisalo antes de continuar.' >&2; exit 1;
  }
fi
for entry in index.html assets favicon.svg; do
  if [[ -e "$project/$entry" || -L "$project/$entry" ]]; then
    [[ -L "$project/$entry" && "$(readlink "$project/$entry")" == "frontend/current/$entry" ]] || {
      echo "No se reemplazara el archivo existente: $entry" >&2; exit 1;
    }
  fi
done
for entry in index.html assets favicon.svg; do
  if [[ ! -L "$project/$entry" ]]; then
    ln -s "frontend/current/$entry" "$project/$entry"
  fi
done
# current conserva las versiones anteriores en releases para recuperacion.
ln -s "$release" "$root/.current-$release_id"
mv -Tf "$root/.current-$release_id" "$root/current"
install -m 644 "$release/.project.htaccess" "$project/.htaccess-$release_id"
mv -Tf "$project/.htaccess-$release_id" "$project/.htaccess"
echo "Frontend publicado en $project"
REMOTE
