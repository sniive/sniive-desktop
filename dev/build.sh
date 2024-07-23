#!/usr/bin/env bash

# On Windows, do :
# cd .\dev\python\
# pyenv global 3.11
# poetry shell
# python3 -m nuitka --standalone --onefile --output-dir=./output/ ./script.py
# cp .\output\script.exe ..\..\resources\script.exe

#set "$(dirname "$0")" as variable (and add absolute path of the script)
location="$(cd "$(dirname "$0")" && pwd)"

# Change directory to the location of the script
cd "$location" || { echo "An error occurred on line $LINENO."; exit 1; }
echo $location


# Function to handle errors
handle_error() {
    echo "An error occurred on line $1."
}

# require imagemagick & icnsutils
(
    cd ./icons || { handle_error $LINENO; }
    png2icns icon.icns *.png || { handle_error $LINENO; }
    convert *.png icon.ico || { handle_error $LINENO; }
    cp icon.icns ../../build/icon.icns || { handle_error $LINENO; }
    cp icon.ico ../../build/icon.ico || { handle_error $LINENO; }
    cp -r . ../../build/icons || { handle_error $LINENO; }
    cp ./icon_512x512.png ../../build/icon.png || { handle_error $LINENO; }
)

cd "$location" || { echo "An error occurred on line $LINENO."; exit 1; }

# require poetry & nuitka
(
    cd ./python || { handle_error $LINENO; }
    source "$(poetry env info --path)/bin/activate" || { handle_error $LINENO; }
    poetry install || { handle_error $LINENO; }
    nuitka3 --standalone --onefile --output-dir=./output/ ./script.py || { handle_error $LINENO; }
    cp ./output/script.bin ../../resources/script.bin || { handle_error $LINENO; }
)

echo "Script completed."
