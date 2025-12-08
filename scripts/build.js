// Build script dengan optimasi memori untuk Windows dan Linux/Mac
const { execSync } = require('child_process');
const path = require('path');

const useSingleWorker = process.argv.includes('--single');

// Set environment variables
process.env.NODE_OPTIONS = '--max-old-space-size=4096';
if (useSingleWorker) {
  process.env.NEXT_PRIVATE_WORKER = '1';
  console.log('Building with optimized memory settings (single worker mode)...');
} else {
  console.log('Building with optimized memory settings...');
}

try {
  // Use npx to find next command - this handles paths with spaces correctly
  const command = 'npx next build';
  
  execSync(command, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=4096',
      ...(useSingleWorker && { NEXT_PRIVATE_WORKER: '1' }),
    },
    shell: true,
  });
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

