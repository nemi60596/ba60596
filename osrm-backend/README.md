# OSRM Setup and Usage Guide

This guide will help you clone the OSRM repository, build a Docker image using the provided Docker directory, download the necessary OSM map, and configure OSRM with a truck profile. Additionally, it provides instructions for ensuring the correct endpoint URLs for way-wise if running your own OSRM instance.

## Prerequisites

- Docker
- Git

## Steps

### 1\. Clone the OSRM Repository

Open your terminal and navigate to the desired directory where you want to clone the repository. Run the following command:


`git clone https://github.com/Project-OSRM/osrm-backend.git` 

This will clone the OSRM repository into your current directory.

### 2\. Build the OSRM Docker Image

Navigate to the `docker` directory within the cloned repository:

`cd osrm-backend/docker` 

Build the Docker image using the provided Dockerfile:

`docker build -t osrm-image .` 

### 3\. Create a Data Directory and Download the OSM Map

Navigate back to the root of the cloned repository and create a data directory:

`cd ..
mkdir -p data` 

Download the OSM map file to the `data` directory. You can use a command like `wget` to download the map. Replace `<OSM_MAP_URL>` with the actual URL of the map you want to download.

`wget -O data/map.osm.pbf <OSM_MAP_URL>` 

### 4\. Configure OSRM with Truck Profile

A configuration example for a truck profile is provided in `truck.lua`. Ensure this file is in the correct location for your OSRM instance to use.


### 7\. Ensuring Correct Endpoint URLs for way-wise

If you are running your own OSRM instance, ensure that the `way-wise` service has the matching endpoint URLs configured. Update the `way-wise` configuration to point to your OSRM instance URL, typically `http://localhost:5000`.

