FROM node:16.18.1
ENV NODE_ENV=production

WORKDIR /

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production

COPY . .

ENV GOERLI_INFURA_PROJECT_ID=786a7764b8234b06b4cd6764a1646a17
ENV SUPABASE_URL=https://zdsoetzzluqvefxlchjm.supabase.co
ENV SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkc29ldHp6bHVxdmVmeGxjaGptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY2NTg1NTAwOCwiZXhwIjoxOTgxNDMxMDA4fQ.Il9RazCs7U_SP1BmHQlXYL8zcymI5dQN6YCBRSHzkFQ

CMD [ "node", "app.js" ]
