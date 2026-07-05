#!/usr/bin/env bash
set -euo pipefail

export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
cd "$(dirname "$0")/.."

if [ ! -d ios ]; then
  npx expo prebuild --platform ios
fi

cd ios
pod install

xcodebuild \
  -workspace Steadfast.xcworkspace \
  -scheme Steadfast \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  build

APP="$(find "$HOME/Library/Developer/Xcode/DerivedData" -path '*/Build/Products/Debug-iphonesimulator/Steadfast.app' -maxdepth 6 2>/dev/null | head -1)"

if [ -z "$APP" ]; then
  echo "Could not find Steadfast.app after build."
  exit 1
fi

xcrun simctl boot "iPhone 17 Pro" 2>/dev/null || true
xcrun simctl bootstatus booted -b
xcrun simctl install booted "$APP"
xcrun simctl launch booted com.steadfast.app
open -a Simulator
