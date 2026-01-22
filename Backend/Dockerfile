# ================================
# Base stage
# ================================
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# ================================
# Dependencies stage
# ================================
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ================================
# Development stage
# ================================
FROM base AS development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# ================================
# Build stage
# ================================
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ================================
# Production stage
# ================================
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Copy only necessary files
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/generated ./generated
COPY --from=build /app/package.json ./

EXPOSE 3000
CMD ["node", "dist/main.js"]
