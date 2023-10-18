#!/usr/bin/env bash
set -ex

URL="https://cdn.openai.com/API/examples/data/winter_olympics_2022.csv"
OUTPUT_FILE="winter_olympics_2022.csv"

curl -o $OUTPUT_FILE $URL

echo "Downloaded $OUTPUT_FILE"
