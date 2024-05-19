#!/usr/bin/env bash

cd "$(dirname "$0")"

poetry install
nuitka3 --standalone --onefile --output-dir=./output/ ./source/script.py
cp ./output/script.bin ../resources/