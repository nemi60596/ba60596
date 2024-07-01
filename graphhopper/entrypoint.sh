#!/bin/sh

java $JAVA_OPTS $GH_WEB_OPTS -Ddw.graphhopper.graph.location=$GRAPH -Ddw.graphhopper.datareader.file=$FILE -jar /graphhopper.jar $ACTION /config.yml
