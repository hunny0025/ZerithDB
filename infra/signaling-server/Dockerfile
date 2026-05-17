FROM node:20-slim

# Create a non-root user for Hugging Face
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR /app

# Copy the bundled server and package info
# esbuild bundles all OTel dependencies into server.cjs — no npm install needed at runtime
COPY --chown=user dist/server.cjs ./dist/
COPY --chown=user package.json ./

# Hugging Face Spaces requires port 7860
ENV PORT=7860
ENV NODE_ENV=production

# OTel defaults — override at runtime via docker run -e or compose environment:
# OTEL_EXPORTER_OTLP_ENDPOINT=http://your-collector:4318
# OTEL_SERVICE_NAME=zerithdb-signaling
# OTEL_SDK_DISABLED=false
ENV OTEL_SERVICE_NAME=zerithdb-signaling
ENV OTEL_SDK_DISABLED=false

EXPOSE 7860

CMD ["node", "dist/server.cjs"]
