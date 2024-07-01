# Valhalla Setup and Usage Guide

This guide will help you clone the `docker-valhalla` repository, build a Docker image, download the necessary map, and configure Valhalla with a truck profile. Additionally, it provides instructions for ensuring the correct endpoint URLs for way-wise and configuring the server using `valhalla.json`.

## Prerequisites

- Docker
- Git
- Node.js (for running `fetchAllBenchmarks.ts` from way-wise)

## Steps

### 1\. Clone the docker-valhalla Repository

Open your terminal and navigate to the desired directory where you want to clone the repository. Run the following command:


`git clone https://github.com/gis-ops/docker-valhalla.git` 

This will clone the `docker-valhalla` repository into your current directory.

### 2\. Build the Valhalla Docker Image

Navigate to the cloned repository directory:

Build the Docker image using the provided Dockerfile:

`docker build -t valhalla-image .` 

### 3\. Configure Valhalla

You can use the `valhalla.json` configuration file provided in the repository. Ensure this file is in the correct location for your Valhalla instance to use.

### 4\. Ensuring Correct Endpoint URLs for way-wise

#### 4.1. Fetch All Benchmarks

To configure the `fetchAllBenchmarks.ts` module from way-wise to send POST requests for the truck profile, you need to make sure the endpoints match. Follow these steps:

1. Navigate to the `way-wise` repository or directory:
        
    `cd path/to/way-wise` 
    
2. Ensure the module is configured to send POST requests to your Valhalla instance URL, typically `http://localhost:8002`.
    

#### 4.2. Update way-wise Configuration

Ensure that way-wise is configured with the correct endpoint URLs to interact with your Valhalla instance.

### 4.3\. Running Your Own Instance

If you are running your own Valhalla instance, ensure that the endpoints match those expected by way-wise. Update the way-wise configuration as necessary.
