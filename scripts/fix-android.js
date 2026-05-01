import fs from 'fs';
import path from 'path';

const gradlePath = path.join(process.cwd(), 'android', 'app', 'build.gradle');

if (fs.existsSync(gradlePath)) {
  let content = fs.readFileSync(gradlePath, 'utf8');
  
  // Set minSdkVersion to 21
  content = content.replace(/minSdkVersion\s*=\s*\d+/, 'minSdkVersion = 21');
  content = content.replace(/minSdkVersion\s+\d+/, 'minSdkVersion 21');
  
  fs.writeFileSync(gradlePath, content);
  console.log('Updated Android build.gradle with minSdkVersion 21');
} else {
  console.log('Android folder not found, skipping SDK update');
}
