import { exportProfiles } from './export-runner.mjs';

try {
  const result = await exportProfiles(['unity-2026-06']);
  const [report] = result.reports;
  console.log(`${report.network}: ${report.outputPath} ${report.actualBytes}/${report.targetMaxBytes} bytes ${report.status}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
