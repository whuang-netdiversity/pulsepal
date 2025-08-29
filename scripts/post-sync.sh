#!/bin/bash
set -e

VERSION_JSON="./android/app/src/main/assets/public/version.json"
VARS_FILE="./android/variables.gradle"
TMP_FILE="./android/variables.tmp.gradle"

if [ ! -f "$VERSION_JSON" ]; then
  echo "❌ version.json not found at $VERSION_JSON"
  exit 1
fi

# Extract the integer version
VERSION=$(grep '"version"' "$VERSION_JSON" | sed -E 's/[^0-9]//g')

echo "🔧 Injecting versionCode = $VERSION and versionName = '$VERSION' into $VARS_FILE"

# Replace lines using a temp file
awk -v ver="$VERSION" '
  /versionCode[[:space:]]*=/ { print "    versionCode = " ver; next }
  /versionName[[:space:]]*=/ { print "    versionName = '\''" ver "'\''"; next }
  { print }
' "$VARS_FILE" > "$TMP_FILE" && mv "$TMP_FILE" "$VARS_FILE"

echo "✅ Injection complete."
