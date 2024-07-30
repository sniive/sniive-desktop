#!/bin/sh
# Create a folder (named dmg) to prepare our DMG in (if it doesn't already exist).
mkdir -p python/dist/dmg
# Empty the dmg folder.
rm -r python/dist/dmg/*
# Copy the app bundle to the dmg folder.
cp -r "python/dist/sniive-script.app" python/dist/dmg
# If the DMG already exists, delete it.
test -f "python/dist/sniive-script.dmg" && rm "python/dist/sniive-script.dmg"
create-dmg \
  --volname "sniive-script" \
  --volicon "icons/sniive-script/icon.icns" \
  --icon-size 100 \
  --icon "sniive-script.app" 175 120 \
  --hide-extension "sniive-script.app" \
  --app-drop-link 425 120 \
  "python/dist/sniive-script.dmg" \
  "python/dist/dmg/"