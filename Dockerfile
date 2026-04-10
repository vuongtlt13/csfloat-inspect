FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

# Copy source
COPY index.js ./

ENV PORT=3000
EXPOSE 3000

CMD ["node", "index.js"]
