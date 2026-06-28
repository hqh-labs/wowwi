import { spawn } from 'node:child_process';
import path from 'node:path';
import { REPO_ROOT } from '../utils/registry-loader.mjs';

/**
 * Runs an npm script inside the project's folder, streaming output to the
 * parent process. Resolves on exit code 0, rejects otherwise.
 */
export function runProjectWorkflow(project, workflowName) {
  if (!project.availableWorkflows?.includes(workflowName)) {
    if (project.status === 'development') {
      return Promise.reject(
        new Error(
          `Project ${project.projectId} is in development status and does not yet implement workflow ${workflowName}.`
        )
      );
    }
    return Promise.reject(
      new Error(
        `Workflow '${workflowName}' is not registered for project '${project.projectId}'. ` +
          `Available: ${(project.availableWorkflows ?? []).join(', ')}`
      )
    );
  }

  const folderPath = path.join(REPO_ROOT, project.folder);
  const isWin = process.platform === 'win32';
  const cmd = isWin ? 'cmd.exe' : 'npm';
  const args = isWin ? ['/d', '/s', '/c', `npm run ${workflowName}`] : ['run', workflowName];

  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: folderPath, stdio: 'inherit' });
    child.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`Workflow '${workflowName}' exited with code ${code}`));
    });
    child.on('error', reject);
  });
}
