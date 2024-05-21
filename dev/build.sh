#!/usr/bin/env bash

cd "$(dirname "$0")"

# require imagemagick & icnsutils
cd ./icons
png2icns icon.icns *.png
convert *.png icon.ico
cp icon.icns ../../build/icon.icns
cp icon.ico ../../build/icon.ico
# copy icons folder
cp -r . ../../build/icons
cp ./icon_512x512.png ../../build/icon.png



# require poetry & nuitka
cd ../python
source $(poetry env info --path)/bin/activate
poetry install
nuitka3 --standalone --onefile --output-dir=./output/ ./script.py
cp ./output/script.bin ../../resources/script.bin