FROM nginx:1.25-alpine

# Remove default Nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy production reverse proxy configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose HTTP port (and HTTPS placeholder)
EXPOSE 80 443

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
