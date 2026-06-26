import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const executeInSandbox = (code, funcName, testCases) => {
  return new Promise((resolve) => {
    const pythonScript = path.join(__dirname, 'run_sandbox.py');
    const child = spawn('python3', [pythonScript]);

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    let isFinished = false;

    child.on('close', (exitCode) => {
      if (isFinished) return;
      isFinished = true;

      if (exitCode !== 0) {
        resolve({
          error: `Sandbox execution failed with exit code ${exitCode}. Error: ${errorOutput.trim()}`,
          results: [],
          overallPassed: false,
        });
        return;
      }

      try {
        const parsed = JSON.parse(output.trim());
        resolve(parsed);
      } catch (err) {
        resolve({
          error: `Failed to parse sandbox output: ${err.message}. Output was: ${output.trim()}`,
          results: [],
          overallPassed: false,
        });
      }
    });

    // Write input payload to stdin
    const payload = JSON.stringify({
      code,
      funcName,
      testCases,
    });

    try {
      child.stdin.write(payload);
      child.stdin.end();
    } catch (err) {
      isFinished = true;
      resolve({
        error: `Failed to write payload to sandbox stdin: ${err.message}`,
        results: [],
        overallPassed: false,
      });
      return;
    }

    // Enforce 3 second timeout
    setTimeout(() => {
      if (isFinished) return;
      isFinished = true;
      child.kill('SIGKILL');
      resolve({
        error: 'Execution Timed Out (Infinite loop or slow code detected). Limit: 3.0s',
        results: [],
        overallPassed: false,
      });
    }, 3000);
  });
};
