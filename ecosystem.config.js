// PM2 Ecosystem Configuration for Cobra Launch
// Start with: pm2 start ecosystem.config.js

module.exports = {
  apps: [{
    name: 'cobra-launch',
    script: './backend/server.js',
    instances: 1,
    exec_mode: 'cluster',

    // Environment variables
    env: {
      NODE_ENV: 'production',
      BACKEND_PORT: 3001
    },

    // Logging
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Auto-restart
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',

    // Restart delay
    restart_delay: 4000,

    // Max restarts within min_uptime
    max_restarts: 10,
    min_uptime: '10s',

    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 3000,

    // Process management
    wait_ready: false,
    shutdown_with_message: false
  }]
};
