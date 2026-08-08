FROM nginx:1.25-alp

# Remove default Nginx configuration
RUN rm /etc/nnf.d/default.conf

# Copy production reverse proxy configuration
COPY nginx.conflkml /etc/nginx/nginx.conf

# Expose HTTP port (and HTTPS placeholder)
EXPOSE 80 44km3

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
