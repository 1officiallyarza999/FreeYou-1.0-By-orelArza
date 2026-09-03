#!/usr/bin/env bash
# התקנה בפקודה אחת. יוצר פרויקט React Native תקין ומרכיב לתוכו את FreeYou.
# שימוש:  bash setup.sh
set -e
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="$SRC/../FreeYouApp"

echo "→ יוצר שלד React Native 0.74.5"
cd "$SRC/.."
npx --yes @react-native-community/cli@14 init FreeYouApp --version 0.74.5 --skip-git-init --install-pods false

cd "$OUT"
echo "→ מתקין תלויות"
npm install --save \
  @react-native-async-storage/async-storage@^1.23.1 \
  @react-native-community/blur@^4.4.1 \
  react-native-linear-gradient@^2.8.3 \
  react-native-svg@^15.2.0 \
  react-native-tts@^4.1.1 \
  @react-native-voice/voice@^3.2.4 \
  react-native-geolocation-service@^5.3.1

echo "→ מרכיב את קוד FreeYou"
rm -f App.tsx App.js
cp -R "$SRC/src" "$SRC/App.tsx" "$SRC/index.js" "$SRC/app.json" .

PKG="android/app/src/main/java/com/freeyouapp"
NEW="android/app/src/main/java/com/freeyou"
mkdir -p "$NEW"
cp "$SRC/$NEW"/*.kt "$NEW"/
cp -R "$SRC/android/app/src/main/res/xml" android/app/src/main/res/
cp "$SRC/android/app/src/main/res/values/strings.xml" android/app/src/main/res/values/
cp "$SRC/android/app/src/main/res/values/styles.xml" android/app/src/main/res/values/
[ -d "$PKG" ] && rm -rf "$PKG"

echo "→ מרכיב את AndroidManifest"
python3 - "$SRC" << 'PY'
import sys, re, io
src = sys.argv[1]
ours = open(f'{src}/android/app/src/main/AndroidManifest.xml').read()
open('android/app/src/main/AndroidManifest.xml', 'w').write(ours)

# applicationId ו-namespace חייבים להיות com.freeyou
g = open('android/app/build.gradle').read()
g = g.replace('com.freeyouapp', 'com.freeyou')
g = re.sub(r'minSdkVersion rootProject\.ext\.minSdkVersion', 'minSdkVersion 26', g)
open('android/app/build.gradle', 'w').write(g)

b = open('android/build.gradle').read()
b = b.replace('minSdkVersion = 23', 'minSdkVersion = 26').replace('minSdkVersion = 24', 'minSdkVersion = 26')
open('android/build.gradle', 'w').write(b)
PY

echo ""
echo "✓ מוכן:  $OUT"
echo ""
echo "  cd ../FreeYouApp"
echo "  npx react-native run-android"
echo ""
echo "אחרי ההתקנה הראשונה — סגור ופתח את האפליקציה פעם אחת (RTL נכנס לתוקף רק אז),"
echo "ואז אשר את שירות הנגישות במסך 'חוסם'."
