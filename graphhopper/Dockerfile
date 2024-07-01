FROM maven:3.9.5-eclipse-temurin-21 as build
WORKDIR /graphhopper
COPY . .
RUN mvn clean install -DskipTests 
FROM eclipse-temurin:21.0.1_12-jre
WORKDIR /

ARG JAVA_OPTS="-XX:HeapSizePerGCThread=1000m -XX:LargePageHeapSizeThreshold=2000m -Xmx32G -Xms1G -Xss1m"
ARG CONFIG="config-example.yml"
ARG FILE="dach-latest.osm.pbf"

ENV GH_WEB_OPTS="-Ddw.server.application_connectors[0].port=8989 -Ddw.server.application_connectors[0].bind_host=0.0.0.0" \
    ACTION="server" \
    GRAPH="/data/default-gh" \
    CONFIG=${CONFIG} \
    FILE=${FILE} \
    JAVA_OPTS=${JAVA_OPTS}

RUN mkdir -p /data
COPY --from=build /graphhopper/web/target/graphhopper*.jar /graphhopper.jar
COPY /countries.geojson /countries.geojson
COPY ${CONFIG} /config.yml
COPY ${FILE} /${FILE}

EXPOSE 8989 8990

HEALTHCHECK --interval=5s --timeout=3s CMD curl --fail http://localhost:8989/health || exit 1

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
