import { exportProfiles } from './export-runner.mjs';

try {
  const result = await exportProfiles();
  printSummary(result.reports);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function printSummary(reports) {
  console.log('Export summary');
  for (const report of reports) {
    console.log(
      `${report.network}: ${report.outputPath} ${report.actualBytes}/${report.targetMaxBytes} bytes ${report.status}`
    );
    for (const warning of report.warnings) console.log(`  WARNING: ${warning}`);
    for (const error of report.errors) console.log(`  ERROR: ${error}`);
  }
}
