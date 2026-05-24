#!/usr/bin/env node

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEFAULT_OUT = 'git-analytics-report.html';
const MAX_BUFFER = 1024 * 1024 * 100;

function main() {
  const args = process.argv.slice(2);
  const options = parseArguments(args);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  checkGitRepo();
  console.log('Analyzing Git history (OSS Version)...');

  let repoPath = process.cwd();
  try {
    repoPath = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  } catch (e) {}
  const repoName = path.basename(repoPath);

  const logArgs = ['-c', 'core.quotepath=false', 'log', '--numstat', '--pretty=format:__COMMIT_START__:%h|%an|%ae|%aI|%s'];
  if (options.since) logArgs.push('--since=' + options.since);
  if (options.until) logArgs.push('--until=' + options.until);

  let logOutput = '';
  try {
    logOutput = execFileSync('git', logArgs, { maxBuffer: MAX_BUFFER, encoding: 'utf8' });
  } catch (err) {
    console.error('Failed to run git commands.');
    process.exit(1);
  }

  const commits = parseGitLog(logOutput);
  const dataset = { repoPath: repoName, commits: commits };
  const base64Payload = Buffer.from(JSON.stringify(dataset)).toString('base64');

  const templatePath = path.join(__dirname, 'template.html');
  if (!fs.existsSync(templatePath)) {
    console.error('Error: template.html not found.');
    process.exit(1);
  }

  const templateContent = fs.readFileSync(templatePath, 'utf8');
  const compiledContent = templateContent.replace('%%GIT_DATA_BASE64%%', base64Payload);
  const outputPath = path.resolve(options.out);
  fs.writeFileSync(outputPath, compiledContent, 'utf8');
  console.log('Report generated successfully: ' + outputPath);
}

function checkGitRepo() {
  try {
    execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { stdio: 'ignore' });
  } catch (err) {
    console.error('Error: Not a valid git repository.');
    process.exit(1);
  }
}

function parseArguments(args) {
  const options = { out: DEFAULT_OUT, since: '', until: '' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out' && args[i + 1]) {
      options.out = args[i + 1];
      i++;
    } else if (args[i] === '--since' && args[i + 1]) {
      options.since = args[i + 1];
      i++;
    } else if (args[i] === '--until' && args[i + 1]) {
      options.until = args[i + 1];
      i++;
    }
  }
  return options;
}

function parseGitLog(rawLog) {
  const lines = rawLog.split(/\r?\n/);
  const commits = [];
  let currentCommit = null;
  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith('__COMMIT_START__:')) {
      const meta = line.substring(17).split('|');
      currentCommit = {
        hash: meta[0],
        authorName: meta[1] || 'Unknown',
        authorEmail: meta[2] || '',
        date: meta[3] || '',
        message: meta.slice(4).join('|') || '',
        added: 0,
        deleted: 0
      };
      commits.push(currentCommit);
    } else if (currentCommit) {
      const parts = line.split(/\s+/);
      if (parts.length >= 3) {
        const added = parts[0] === '-' ? 0 : parseInt(parts[0], 10);
        const deleted = parts[1] === '-' ? 0 : parseInt(parts[1], 10);
        if (!isNaN(added) && !isNaN(deleted)) {
          currentCommit.added += added;
          currentCommit.deleted += deleted;
        }
      }
    }
  }
  return commits;
}

function printHelp() {
  console.log('\nGitAnalytics OSS - Local Git History Visualizer\n\nOptions:\n  --out <filename>      Path to output HTML report (default: git-analytics-report.html)\n  --since <date>        Analyze commits after date\n  --until <date>        Analyze commits before date\n');
}

main();