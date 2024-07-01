#!/bin/bash

if [ "$#" -ne 1 ]; then
    echo "Benutzung: $0 <Dateiname-zum-Löschen>"
    exit 1
fi

FILE_TO_DELETE=$1

TARGET_DIRECTORIES=("../graphhopper" "../osrm-backend/data" "../valhalla")

echo "Versuche, $FILE_TO_DELETE aus den Zielverzeichnissen zu löschen..."

for dir in "${TARGET_DIRECTORIES[@]}"; do
    if [ -f "$dir/$FILE_TO_DELETE" ]; then
        rm "$dir/$FILE_TO_DELETE"
        echo "Gelöscht $FILE_TO_DELETE aus $dir/"
    else
        echo "$FILE_TO_DELETE existiert nicht in $dir."
    fi
done