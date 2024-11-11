const { execSync } = require('child_process');
const os = require('os');

function installFFmpeg() {
  try {
    console.log('Installing FFmpeg...');
    
    if (os.platform() === 'linux') {
      execSync('npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg', {
        stdio: 'inherit'
      });
    } else {
      console.log('Local development: Skipping FFmpeg installation');
    }
    
    console.log('FFmpeg installation completed');
  } catch (error) {
    console.error('Error installing FFmpeg:', error);
    process.exit(1);
  }
}

installFFmpeg(); 