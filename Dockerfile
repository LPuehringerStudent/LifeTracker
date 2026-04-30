# Build stage for frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY lifetracker-frontend/package.json ./
RUN npm install
COPY lifetracker-frontend/ ./
RUN npx ng build --configuration production

# Build stage for backend
FROM node:22-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

# Production stage
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy backend build
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/package.json /app/backend/package-lock.json ./
RUN npm ci --omit=dev

# Copy frontend build into the path the backend expects
COPY --from=frontend-builder /app/frontend/dist/lifetracker-frontend/browser ./frontend/dist/lifetracker-frontend/browser

EXPOSE 3000
CMD ["node", "dist/app.js"]
