# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy frontend files
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .

# Build arguments for environment variables
ARG VITE_DATA_SOURCE=supabase
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_DATA_SOURCE=$VITE_DATA_SOURCE
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/ || exit 1

EXPOSE 3000
CMD ["sh", "-c", "serve dist -s -l ${PORT:-3000}"]
