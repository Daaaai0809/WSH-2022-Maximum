#!/bin/bash

for ((i=1; i<=20; i++)); do
    convert -resize 400x225^ -gravity center -extent 400x225 $(printf "./races/%03d.webp" "$i") $(printf "./races_225/%03d.webp" "$i")
done;
