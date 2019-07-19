FROM node:slim

LABEL "name"="create-welcome-comment"
LABEL "maintainer"="Babel Team"
LABEL "version"="1.0.0"

LABEL "com.github.actions.name"="Create welcome comment"
LABEL "com.github.actions.description"="Creates a new comment on newly opened issues"
LABEL "com.github.actions.icon"="message-square"
LABEL "com.github.actions.color"="red"

COPY package.json ./
COPY yarn.lock ./

RUN yarn install --frozen-lockfile --non-interactive

COPY entrypoint.js /entrypoint.js

ENTRYPOINT ["node", "/entrypoint.js"]
