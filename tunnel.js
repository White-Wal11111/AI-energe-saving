// Keep tunnel alive with auto-restart
const http = require('http');
const { exec } = require('child_process');

const PORT = 3000;
let tunnelProcess = null;

function startTunnel() {
  console.log('[Tunnel] Starting localtunnel...');
  
  tunnelProcess = exec(
    'npx localtunnel --port 3000 --subdomain smart-building',
    (err, stdout, stderr) => {
      if (stdout) process.stdout.write(stdout);
      if (stderr) process.stderr.write(stderr);
    }
  );
  
  // Auto-restart every 30 minutes
  setTimeout(() => {
    if (tunnelProcess) {
      console.log('[Tunnel] Restarting...');
      tunnelProcess.kill();
      startTunnel();
    }
  }, 30 * 60 * 1000); // 30 min
}

// Verify local server first
http.get(`http://localhost:${PORT}`, (res) => {
  if (res.statusCode === 200) {
    console.log(`[Tunnel] Local server OK on port ${PORT}`);
    startTunnel();
  } else {
    console.error(`[Tunnel] Local server returned ${res.statusCode}`);
  }
}).on('error', () => {
  console.error('[Tunnel] Local server not running! Starting it first...');
  exec('npm run dev', { cwd: 'frontend' });
  setTimeout(() => {
    startTunnel();
  }, 15000);
});
