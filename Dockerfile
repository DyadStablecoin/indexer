FROM node:16.18.1
ENV NODE_ENV=production

WORKDIR /

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production

COPY . .

ARG GOERLI_INFURA_PROJECT_ID
ENV GOERLI_INFURA_PROJECT_ID=$GOERLI_INFURA_PROJECT_ID

ARG SUPABASE_URL
ENV SUPABASE_URL=$SUPABASE_URL

ARG SUPABASE_KEY
ENV SUPABASE_KEY=$SUPABASE_KEY

CMD [ "node", "app.js" ]
