FROM ubuntu:18.04
ARG STEL_VERSION="0.20.2"
WORKDIR /opt/stellarium

RUN DEBIAN_FRONTEND="noninteractive" apt-get update && apt-get install -y wget xvfb

RUN wget -q \
"https://github.com/Stellarium/stellarium/releases/download/v$STEL_VERSION/Stellarium-$STEL_VERSION-x86_64.AppImage" \
-O ./stellarium.appimage
RUN chmod +x ./stellarium.appimage
RUN ./stellarium.appimage --appimage-extract
RUN cp -r ./squashfs-root/* /

COPY config.ini ./

EXPOSE 8090
#CMD ["sleep", "30000"]
CMD ["/usr/bin/stellarium", "-c", "./config.ini"]