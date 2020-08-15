#!/bin/sh
Xvfb :99 -screen 0 1024x1024x16 -nolisten tcp &
DISPLAY=:99 /usr/bin/stellarium -c ./config.ini