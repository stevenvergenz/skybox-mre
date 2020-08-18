FROM ubuntu:20.04
ARG STEL_VERSION="0.20.2"
WORKDIR /opt/stellarium

RUN DEBIAN_FRONTEND="noninteractive" apt-get update && apt-get install -y \
    wget xvfb libglib2.0-0 libxcb-xinerama0 libfontconfig1 dbus openssl libssl1.1 libqt5network5

RUN wget -q \
    "https://github.com/Stellarium/stellarium/releases/download/v$STEL_VERSION/Stellarium-$STEL_VERSION-x86_64.AppImage" \
    -O ./stellarium.appimage \
    && chmod +x ./stellarium.appimage \
    && ./stellarium.appimage --appimage-extract \
    && cp -r ./squashfs-root/* / \
    && rm -rf ./squashfs-root \
    && ldconfig

COPY config.ini .
COPY start.sh .

EXPOSE 8090/tcp
CMD ["./start.sh"]
#CMD sleep 30000