FROM node:20-alpine

WORKDIR /app

# Enable corepack for Yarn Berry
RUN corepack enable

# Install dependencies first (better layer caching)
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

# Copy source
COPY index.js ./
COPY src ./src

ENV PORT=3000
EXPOSE 3000

CMD ["node", "index.js"]
