#!/bin/bash

if [ "$#" -ne 1 ]; then
    echo "Benutzung: $0 <Dateiname-zum-Kopieren>"
    exit 1
fi

FILE_TO_COPY=$1

if [ ! -f "../data/$FILE_TO_COPY" ]; then
    echo "Die Datei ../data/$FILE_TO_COPY existiert nicht."
    exit 1
fi

FILE_COPIED=false

TARGET_DIRECTORIES=("../graphhopper" "../osrm-backend/data" "../valhalla")

for dir in "${TARGET_DIRECTORIES[@]}"; do
    if [ ! -f "$dir/$FILE_TO_COPY" ]; then
        cp "../data/$FILE_TO_COPY" "$dir/"
        echo "Kopiert $FILE_TO_COPY nach $dir/"
        FILE_COPIED=true
    else
        echo "Datei $FILE_TO_COPY existiert bereits in $dir. Überspringe."
    fi
done

if [ "$FILE_COPIED" = true ]; then
    sed -i "1s/.*/OSM_FILE_NAME=$FILE_TO_COPY/" "../.env"
    echo "OSM_FILE_NAME in .env aktualisiert zu: $FILE_TO_COPY"
fi