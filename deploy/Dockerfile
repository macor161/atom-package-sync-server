FROM node:6.9.5
EXPOSE 80
COPY . ./var/www
ENV NODE_ENV=production
RUN cd /var/www && npm install --production
CMD cd /var/www && node bin/www
