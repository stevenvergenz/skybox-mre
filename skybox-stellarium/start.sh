#!/bin/sh

# start X
rm /tmp/.X99-lock
Xvfb :99 -screen 0 1024x1024x16 -nolisten tcp &

# clear screenshot dir
rm -f /root/screenshots/*

# start stellarium
DISPLAY=:99 /usr/bin/stellarium -c ./config.ini --screenshot-dir /root/screenshots >> /dev/null