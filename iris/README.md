# Iris Setup and Usage Guide

This guide will help you clone the Iris repository, build a Docker image using the provided Dockerfile, run the MariaDB instance using Docker Compose, and ensure all endpoints are correctly set for way-wise.

## Prerequisites

- Docker
- Docker Compose
- Git

## Steps

### 1\. Clone the Iris Repository

Open your terminal and navigate to the desired directory where you want to clone the repository. Run the following command:

`git clone git@github.com:Contargo/iris.git` 

This will clone the Iris repository into your current directory.

### 2\. Build the Iris Docker Image

Navigate to the cloned repository directory:

`cd iris` 

Build the Docker image using the provided Dockerfile:

`docker build -t iris-image .` 

### 3\. Run the MariaDB Instance

Ensure that you have a `docker-compose.yml` file in the root directory of the Iris repository. If it is not present, create one with the following content:


### 4\. Configure Iris

Ensure that Iris is configured to connect to the MariaDB instance. You may need to edit the configuration files within the Iris repository to point to the MariaDB instance. 

### 5\. Ensuring Correct Endpoint URLs for way-wise

Ensure that way-wise is configured with the correct endpoint URLs to interact with your Iris instance. Update the way-wise configuration to point to your Iris instance URL, typically `http://localhost:8082`.

### 6\. Running Your Own Instance

If you are running your own Iris instance, ensure that the endpoints match those expected by way-wise. Update the way-wise configuration as necessary.
