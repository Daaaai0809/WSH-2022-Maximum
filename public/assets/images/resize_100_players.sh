#!/bin/bash

for ((i=1; i<=20; i++)); do
    convert -resize 100x100^ -gravity center -extent 100x100 $(printf "./players/%03d.webp" "$i") $(printf "./players_100/%03d.webp" "$i")
done;
