#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

TARGET="$1"

if [ -z "$TARGET" ]; then
    echo "❌ No target specified. Usage: ./scripts/post-build.sh [web|mobile]"
    exit 1
fi

if [ "$TARGET" != "web" ] && [ "$TARGET" != "mobile" ]; then
    echo "❌ Invalid target '$TARGET'. Allowed: web, mobile"
    exit 1
fi

DEST_DIR="dist"
EXCLUDE_FILE="$SCRIPT_DIR/.rsyncignore-web"

if [ "$TARGET" == "mobile" ]; then
    DEST_DIR="www"
    EXCLUDE_FILE="$SCRIPT_DIR/.rsyncignore-mobile"
fi

echo "📦 Preparing post-build artifacts for target: $TARGET → $DEST_DIR/"
echo "📄 Using exclude list: $EXCLUDE_FILE"

rm -rf "$DEST_DIR"
mkdir -p "$DEST_DIR"

rsync -av --progress ./ "$DEST_DIR" --exclude-from="$EXCLUDE_FILE"

echo "✅ Post-build copy complete for $TARGET → $DEST_DIR/"

# ⚠️ Clean up stale splash assets (only for mobile build)
if [ "$TARGET" == "mobile" ]; then
    echo "🧹 Cleaning old splash assets from iOS and Android..."
    find ios/App/App/Assets.xcassets/Splash.imageset -type f -name 'splash*.png' -delete || true
    find android/app/src/main/res/drawable* -type f -name 'splash*.png' -delete || true
    echo "✅ Splash asset cleanup complete."
fi
