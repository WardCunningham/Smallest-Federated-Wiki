#!/bin/sh

# Script to create a stub plugin with stub documentation

if [ $# -eq 0 ]
  then
    echo "Usage: ./mkplugin.sh <new-plugin-name>"
    echo "e.g. ./mkplugin.sh CoolThing"
    exit 0
fi

if [ ! -d plugins ]
	then
		echo "can't find plugins directory (running from client directory?)"
		exit 1
fi

name=`echo $1 | tr '[A-Z]' '[a-z]'`
date=`date -u +%s`
msec=000

if [ "$1" == "$name" ]
	then
		echo "Expected capitalized name"
		echo "e.g. CoolThing"
		exit 2
fi

if [ -e plugins/$name ]
	then
		echo "plugin directory already exists: $name"
		exit 3
fi

mkdir plugins/$name
cat <<EOF > plugins/$name/$name.coffee
emit = (\$item, item) ->
  \$item.append """
    <p style="background-color:#eee;padding:15px;">
      #{item.text}
    </p>
  """

bind = (\$item, item) ->
  \$item.dblclick -> wiki.textEditor \$item, item

window.plugins.$name = {emit, bind}
EOF

mkdir plugins/$name/pages
title='"About '"$1"' Plugin"'
id1=`cat /dev/urandom | env LC_CTYPE=C tr -cd 'a-f0-9' | head -c 16`
id2=`cat /dev/urandom | env LC_CTYPE=C tr -cd 'a-f0-9' | head -c 16`

read -r -d '' story <<EOF
[
  {
    "type": "paragraph",
    "id": "$id1",
    "text": "Here we describe the purpose of the plugin and include a sample."
  },
  {
    "type": "$name",
    "id": "$id2",
    "text": "This is text in the new plugin. You can double-click to edit it too."
  }
]
EOF

read -r -d '' journal <<EOF
[
  {
    "type": "create",
    "item": {
      "title": $title,
      "story": $story
    },
    "date": $date$msec,
    "certificate": "from mkplugin.sh"
  }
]
EOF

cat <<EOF > plugins/$name/pages/about-$name-plugin
{
  "title": $title,
  "story": $story,
  "journal": $journal
}
EOF

echo Plugin and documentation pages created.
echo Build with client/builder.sh or grunt build
echo View localhost:1111/about-$name-plugin.html
echo Edit client/plugins/$name/$name.coffee

echo
