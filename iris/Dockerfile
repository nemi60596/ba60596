FROM maven:3.6.3-jdk-8 as builder
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN mvn clean package
RUN ls -la /usr/src/app/target/
CMD ["./mvnw", "jetty:run"]