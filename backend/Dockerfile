# --- build stage ---------------------------------------------------------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B -DskipTests package

# --- runtime stage --------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /build/target/backend.jar app.jar

# Render's free instance is 512 MB. UseContainerSupport lets the JVM read the
# cgroup memory limit; MaxRAMPercentage caps the heap at 70% of it, leaving
# headroom for metaspace, threads, and the OS. SerialGC and a smaller thread
# stack keep GC and per-thread overhead low at this heap size.
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=70.0 -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError -Xss512k"

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
