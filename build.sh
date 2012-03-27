ETHERPAD_ROOT="$(cd $(dirname "$0"); pwd)/../../../../"
. "$ETHERPAD_ROOT/bin/exports.sh"

(
  mkdir -p ../.extdeps
  cd ../.extdeps

  #### Dojo ####

  [ -e dojo-release-1.6.0-src.tar.gz ] || wget http://download.dojotoolkit.org/release-1.6.0/dojo-release-1.6.0-src.tar.gz
  [ -e dojo-release-1.6.0-src ] || {
    tar -xvzf dojo-release-1.6.0-src.tar.gz
  
    # We have our own rihno...
    cat > dojo-release-1.6.0-src/util/buildscripts/build.sh <<EOF
#! /bin/bash
ETHERPAD_ROOT="\$(cd \$(dirname "\$0")/../../../../../../..; pwd)"
DOJOSRC="\$ETHERPAD_ROOT/etherpad/src/plugins/.extdeps/dojo-release-1.6.0-src"
DOJOUTILS="\$DOJOSRC/util"
DOJOBUILD="\$DOJOUTILS/buildscripts"

java -classpath \$DOJOUTILS/shrinksafe/js.jar:\$DOJOUTILS/shrinksafe/shrinksafe.jar:\$ETHERPAD_ROOT/infrastructure/lib/rhino-js-1.7r1.jar org.mozilla.javascript.tools.shell.Main -e "buildScriptsPath='\$DOJOBUILD/'" "\$DOJOBUILD/build.js" "\$@"
EOF

  }
)

DOJOSRC="$ETHERPAD_ROOT/etherpad/src/plugins/.extdeps/dojo-release-1.6.0-src"
DOJOUTILS="$DOJOSRC/util"
DOJOBUILD="$DOJOUTILS/buildscripts"

(
 cd static/js
  rm -rf dojo dijit dojox
  cp -a "$DOJOSRC/"{dojo,dijit,dojox} .

  cp "$DOJOBUILD/build.sh" "$DOJOBUILD/build.sh.x"
  cat > "$DOJOBUILD/build.sh" <<EOF
#!/bin/bash
set -x

echo "hej"
pwd
echo "hopp"

EOF
  cat "$DOJOBUILD/build.sh.x" >> "$DOJOBUILD/build.sh"

  "$DOJOBUILD/build.sh" action=release profileFile=profile.js layerOptimize=shrinksafe mini=true releaseDir=build
)
