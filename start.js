const { spawn } = require('child_process');
const path = require('path');

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    yellow: '\x1b[33m'
};

console.log(`${colors.bright}${colors.green}🚀 Starting Auction System Offline Environment...${colors.reset}\n`);

// Helper to prefix output
function logOutput(prefix, color, data) {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
        if (line.trim()) {
            console.log(`${color}[${prefix}]${colors.reset} ${line}`);
        }
    });
}

// 1. Start Server (Backend)
const serverPath = path.join(__dirname, 'server');
const serverProcess = spawn('npm', ['run', 'dev'], { 
    cwd: serverPath, 
    shell: true,
    env: { ...process.env, FORCE_COLOR: 'true' }
});

serverProcess.stdout.on('data', (data) => logOutput('Server', colors.cyan, data));
serverProcess.stderr.on('data', (data) => logOutput('Server Error', colors.red, data));

// 2. Start Client (Frontend)
const clientPath = path.join(__dirname, 'client');
const clientProcess = spawn('npm', ['run', 'dev'], { 
    cwd: clientPath, 
    shell: true,
    env: { ...process.env, FORCE_COLOR: 'true' }
});

clientProcess.stdout.on('data', (data) => logOutput('Client', colors.green, data));
clientProcess.stderr.on('data', (data) => logOutput('Client Error', colors.red, data));

// Handle process terminations
let isExiting = false;
const cleanExit = () => {
    if (isExiting) return;
    isExiting = true;
    console.log(`\n${colors.bright}${colors.yellow}Shutting down processes...${colors.reset}`);
    try {
        serverProcess.kill('SIGINT');
    } catch (e) {}
    try {
        clientProcess.kill('SIGINT');
    } catch (e) {}
    setTimeout(() => {
        process.exit(0);
    }, 500);
};

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);

serverProcess.on('close', (code) => {
    if (!isExiting) {
        console.log(`${colors.red}[Server] Process exited with code ${code}${colors.reset}`);
        cleanExit();
    }
});

clientProcess.on('close', (code) => {
    if (!isExiting) {
        console.log(`${colors.red}[Client] Process exited with code ${code}${colors.reset}`);
        cleanExit();
    }
});
