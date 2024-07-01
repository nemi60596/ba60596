#!/bin/bash

# Define the path for the log file
LOG_FILE="container_stats.log"

# Check if the log file already exists and remove it to start fresh
if [ -f "$LOG_FILE" ]; then
    rm "$LOG_FILE"
fi

# Infinite loop to log stats every 10 seconds
while true
do
    echo "Logging container stats at $(date)" >> "$LOG_FILE"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" >> "$LOG_FILE"
    echo "---------------------------------------------" >> "$LOG_FILE"
    sleep 10
done
