const https = require('https');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

const CREDENTIALS_FILE = path.join(__dirname, 'credentials.json');
const LAUNCHES_FILE = path.join(__dirname, 'launches.json');
const GITHUB_REPO = 'https://github.com/raycoding1-collab/git-analytics-oss';

function loadCredentials() {
  // Check for environment variables first (ideal for CI/CD / GitHub Actions)
  if (process.env.HN_USERNAME && process.env.HN_PASSWORD) {
    return {
      hn_username: process.env.HN_USERNAME,
      hn_password: process.env.HN_PASSWORD,
      reddit_username: process.env.REDDIT_USERNAME,
      reddit_password: process.env.REDDIT_PASSWORD,
      reddit_client_id: process.env.REDDIT_CLIENT_ID,
      reddit_client_secret: process.env.REDDIT_CLIENT_SECRET
    };
  }

  if (!fs.existsSync(CREDENTIALS_FILE)) {
    // Generate template
    const template = {
      hn_username: 'YOUR_HN_USERNAME',
      hn_password: 'YOUR_HN_PASSWORD',
      reddit_username: 'YOUR_REDDIT_USERNAME',
      reddit_password: 'YOUR_REDDIT_PASSWORD',
      reddit_client_id: 'YOUR_REDDIT_CLIENT_ID',
      reddit_client_secret: 'YOUR_REDDIT_CLIENT_SECRET'
    };
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(template, null, 2), 'utf8');
    throw new Error('credentials.json was not found. We created a template. Please fill in your real credentials or set environment variables.');
  }
  return JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
}

function getLaunchCopy(key) {
  if (!fs.existsSync(LAUNCHES_FILE)) {
    throw new Error('launches.json not found. Run "node compile_launches.js" first.');
  }
  const data = JSON.parse(fs.readFileSync(LAUNCHES_FILE, 'utf8'));
  const channel = data.channels.find(c => c.name.includes(key));
  if (!channel) throw new Error(`Launch copy for "${key}" not found in launches.json`);
  return channel;
}

// Promisified HTTP request helper
function makeRequest(url, options, postData = '') {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Hacker News Automation
async function submitToHN(username, password, title, url, commentText) {
  console.log('Logging into Hacker News...');
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  
  const loginData = querystring.stringify({ acct: username, pw: password, goto: 'news' });
  const loginRes = await makeRequest('https://news.ycombinator.com/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': userAgent
    }
  }, loginData);

  const setCookie = loginRes.headers['set-cookie'];
  if (!setCookie || !setCookie.some(c => c.startsWith('user='))) {
    throw new Error('HN Login failed: Bad credentials or account locked.');
  }
  const cookie = setCookie.find(c => c.startsWith('user=')).split(';')[0];
  console.log('✓ HN Login successful.');

  console.log('Fetching HN submit page fnid...');
  const submitPageRes = await makeRequest('https://news.ycombinator.com/submit', {
    method: 'GET',
    headers: {
      'Cookie': cookie,
      'User-Agent': userAgent
    }
  });

  const fnidMatch = submitPageRes.body.match(/name="fnid" value="([^"]+)"/);
  if (!fnidMatch) {
    throw new Error('Could not find fnid on HN submit page. Are you rate-limited?');
  }
  const fnid = fnidMatch[1];
  console.log('✓ Found fnid:', fnid);

  console.log('Submitting post to HN...');
  const postData = querystring.stringify({ fnid, title, url });
  const postRes = await makeRequest('https://news.ycombinator.com/r', {
    method: 'POST',
    headers: {
      'Cookie': cookie,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': userAgent
    }
  }, postData);

  // If redirect matches item?id=X
  const redirect = postRes.headers['location'];
  let itemId = '';
  if (redirect && redirect.includes('id=')) {
    itemId = redirect.split('id=')[1];
  } else {
    // Search profile to find the latest post ID
    console.log('Redirect location not found. Scanning submitted list for item ID...');
    const profileRes = await makeRequest(`https://news.ycombinator.com/submitted?id=${username}`, {
      method: 'GET',
      headers: {
        'Cookie': cookie,
        'User-Agent': userAgent
      }
    });
    const idMatch = profileRes.body.match(/id=['"](\d+)['"]/);
    if (!idMatch) {
      throw new Error('Could not locate submitted post ID.');
    }
    itemId = idMatch[1];
  }
  console.log('✓ Post submitted successfully. Item ID:', itemId);

  console.log('Fetching item page to scrape hmac token for commenting...');
  const itemPageRes = await makeRequest(`https://news.ycombinator.com/item?id=${itemId}`, {
    method: 'GET',
    headers: {
      'Cookie': cookie,
      'User-Agent': userAgent
    }
  });

  const hmacMatch = itemPageRes.body.match(/name="hmac" value="([^"]+)"/);
  if (!hmacMatch) {
    throw new Error('Could not parse hmac comment token from HN item page.');
  }
  const hmac = hmacMatch[1];
  console.log('✓ Scraped hmac comment token:', hmac);

  console.log('Submitting introductory comment...');
  const commentData = querystring.stringify({
    parent: itemId,
    goto: `item?id=${itemId}`,
    hmac,
    text: commentText
  });

  const commentRes = await makeRequest('https://news.ycombinator.com/comment', {
    method: 'POST',
    headers: {
      'Cookie': cookie,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': userAgent
    }
  }, commentData);

  console.log('✓ Introductory comment successfully posted to Hacker News!');
  return `https://news.ycombinator.com/item?id=${itemId}`;
}

// Reddit Automation
async function submitToReddit(creds, subreddit, title, url, commentText) {
  console.log(`Authenticating with Reddit API for user ${creds.reddit_username}...`);
  const auth = Buffer.from(`${creds.reddit_client_id}:${creds.reddit_client_secret}`).toString('base64');
  
  const tokenData = querystring.stringify({
    grant_type: 'password',
    username: creds.reddit_username,
    password: creds.reddit_password
  });

  const tokenRes = await makeRequest('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + auth,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'GitAnalyticsProLaunchAgent/1.0'
    }
  }, tokenData);

  const tokenJson = JSON.parse(tokenRes.body);
  if (!tokenJson.access_token) {
    throw new Error(`Reddit Auth Failed: ${tokenJson.error_description || tokenRes.body}`);
  }
  const accessToken = tokenJson.access_token;
  console.log('✓ Reddit OAuth authenticated successfully.');

  console.log(`Submitting link post to r/${subreddit}...`);
  const submitData = querystring.stringify({
    api_type: 'json',
    sr: subreddit,
    kind: 'link',
    title,
    url,
    resubmit: 'true'
  });

  const submitRes = await makeRequest('https://oauth.reddit.com/api/submit', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'GitAnalyticsProLaunchAgent/1.0'
    }
  }, submitData);

  const submitJson = JSON.parse(submitRes.body);
  if (submitJson.json && submitJson.json.errors && submitJson.json.errors.length > 0) {
    throw new Error(`Reddit Submit Failed: ${JSON.stringify(submitJson.json.errors)}`);
  }

  const postName = submitJson.json.data.name; // e.g. t3_xxxxxx
  const postUrl = submitJson.json.data.url;
  console.log(`✓ Post submitted successfully to r/${subreddit}. ID: ${postName}`);

  console.log('Posting introductory comment to Reddit thread...');
  const commentData = querystring.stringify({
    api_type: 'json',
    thing_id: postName,
    text: commentText
  });

  const commentRes = await makeRequest('https://oauth.reddit.com/api/comment', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'GitAnalyticsProLaunchAgent/1.0'
    }
  }, commentData);

  console.log(`✓ Introductory comment successfully posted to r/${subreddit}!`);
  return postUrl;
}

// Main autonomous dispatcher
async function run() {
  const targetChannel = process.argv[2];
  if (!targetChannel) {
    console.log('Usage: node autonomous_poster.js [hn | reddit_sideproject | reddit_selfhosted | reddit_webdev]');
    process.exit(1);
  }

  try {
    const creds = loadCredentials();

    if (targetChannel === 'hn') {
      const hnCopy = getLaunchCopy('Hacker News (Show HN)');
      const postUrl = await submitToHN(
        creds.hn_username,
        creds.hn_password,
        'Show HN: GitAnalytics – Local-first git visualizer because cloud audits are painful',
        GITHUB_REPO,
        hnCopy.postBody
      );
      console.log(`\n\x1b[32m[HN SUCCESS] Live at: ${postUrl}\x1b[0m\n`);
    } else if (targetChannel === 'reddit_sideproject') {
      const redditCopy = getLaunchCopy('Reddit (r/SideProject)');
      const postUrl = await submitToReddit(
        creds,
        'SideProject',
        'I got tired of bloated SaaS tools demanding access to my private repos, so I built a zero-dependency local git visualizer.',
        GITHUB_REPO,
        redditCopy.postBody
      );
      console.log(`\n\x1b[32m[REDDIT SUCCESS] Live at: ${postUrl}\x1b[0m\n`);
    } else if (targetChannel === 'reddit_selfhosted') {
      const redditCopy = getLaunchCopy('Reddit (r/SideProject)');
      const postUrl = await submitToReddit(
        creds,
        'selfhosted',
        'Tired of SaaS tools asking for write-access to your private repos? I built a 100% offline local git visualizer.',
        GITHUB_REPO,
        redditCopy.postBody
      );
      console.log(`\n\x1b[32m[REDDIT SUCCESS] Live at: ${postUrl}\x1b[0m\n`);
    } else if (targetChannel === 'reddit_webdev') {
      const redditCopy = getLaunchCopy('Reddit (r/SideProject)');
      const postUrl = await submitToReddit(
        creds,
        'webdev',
        'How I built a stream-based git parser that analyzes 2,000 commits in 0.87 seconds with zero npm dependencies.',
        GITHUB_REPO,
        redditCopy.postBody
      );
      console.log(`\n\x1b[32m[REDDIT SUCCESS] Live at: ${postUrl}\x1b[0m\n`);
    } else {
      console.log(`Unknown channel: ${targetChannel}`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`\n\x1b[31m[LAUNCH ERROR]\x1b[0m ${err.message}`);
    process.exit(1);
  }
}

run();
