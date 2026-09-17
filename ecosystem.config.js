module.exports = {
  apps: [
    {
      name: "lucian-logs",
      script: "server.js",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 5000
      }
    }
  ]
};
