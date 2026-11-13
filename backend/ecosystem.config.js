module.exports = {
  apps: [
    {
      name: 'connect-agent',
      script: './dist/server.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 8083,
        BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:8083'
      }
    }
  ]
};
