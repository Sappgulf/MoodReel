#!/usr/bin/env node
/**
 * MoodReel Smoke Test Suite
 * 
 * Validates critical paths are working before deployment.
 * Run with: npm run smoke
 * 
 * Prerequisites:
 * - Dev server running on localhost:3001 (or PORT env var)
 * - TMDB API key configured
 */

const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3001;
const BASE_URL = `http://localhost:${PORT}`;
const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY || 'f2b1a353af51ccd27736c209f7ea0ca6';

// Test results
const results = {
    passed: 0,
    failed: 0,
    tests: []
};

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    dim: '\x1b[2m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function pass(name, details = '') {
    results.passed++;
    results.tests.push({ name, status: 'PASS', details });
    log(`  ✓ ${name}`, 'green');
    if (details) log(`    ${details}`, 'dim');
}

function fail(name, error) {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: error.toString() });
    log(`  ✗ ${name}`, 'red');
    log(`    Error: ${error}`, 'red');
}

// HTTP request helper
function request(url, options = {}) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, { timeout: 10000, ...options }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, data, headers: res.headers });
            });
        });
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

// ============ SMOKE TESTS ============

async function testDevServerResponds() {
    try {
        const res = await request(BASE_URL);
        if (res.status === 200 && res.data.includes('MoodReel')) {
            pass('Dev server responds', `Status: ${res.status}, Contains MoodReel`);
        } else {
            fail('Dev server responds', `Status: ${res.status}, Missing MoodReel in response`);
        }
    } catch (e) {
        fail('Dev server responds', e);
    }
}

async function testStaticAssets() {
    try {
        const res = await request(`${BASE_URL}/manifest.json`);
        if (res.status === 200) {
            const manifest = JSON.parse(res.data);
            if (manifest.name && manifest.name.includes('MoodReel')) {
                pass('Static assets (manifest.json)', `App name: ${manifest.name}`);
            } else {
                fail('Static assets (manifest.json)', `Invalid manifest name: ${manifest.name}`);
            }
        } else {
            fail('Static assets (manifest.json)', `Status: ${res.status}`);
        }
    } catch (e) {
        fail('Static assets (manifest.json)', e);
    }
}

async function testTMDBApiConnectivity() {
    try {
        const url = `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&page=1`;
        const res = await request(url);
        if (res.status === 200) {
            const data = JSON.parse(res.data);
            if (data.results && data.results.length > 0) {
                pass('TMDB API connectivity', `Got ${data.results.length} movies`);
            } else {
                fail('TMDB API connectivity', 'No results returned');
            }
        } else {
            fail('TMDB API connectivity', `Status: ${res.status}`);
        }
    } catch (e) {
        fail('TMDB API connectivity', e);
    }
}

async function testTMDBSearchEndpoint() {
    try {
        const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=comedy`;
        const res = await request(url);
        if (res.status === 200) {
            const data = JSON.parse(res.data);
            if (data.results && data.results.length > 0) {
                pass('TMDB search endpoint', `Found ${data.results.length} results for "comedy"`);
            } else {
                fail('TMDB search endpoint', 'No search results');
            }
        } else {
            fail('TMDB search endpoint', `Status: ${res.status}`);
        }
    } catch (e) {
        fail('TMDB search endpoint', e);
    }
}

async function testTMDBTVEndpoint() {
    try {
        const url = `https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&page=1`;
        const res = await request(url);
        if (res.status === 200) {
            const data = JSON.parse(res.data);
            if (data.results && data.results.length > 0) {
                pass('TMDB TV endpoint', `Got ${data.results.length} TV shows`);
            } else {
                fail('TMDB TV endpoint', 'No TV results');
            }
        } else {
            fail('TMDB TV endpoint', `Status: ${res.status}`);
        }
    } catch (e) {
        fail('TMDB TV endpoint', e);
    }
}

async function testTMDBGenresEndpoint() {
    try {
        const url = `https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}`;
        const res = await request(url);
        if (res.status === 200) {
            const data = JSON.parse(res.data);
            if (data.genres && data.genres.length > 0) {
                pass('TMDB genres endpoint', `Got ${data.genres.length} genres`);
            } else {
                fail('TMDB genres endpoint', 'No genres returned');
            }
        } else {
            fail('TMDB genres endpoint', `Status: ${res.status}`);
        }
    } catch (e) {
        fail('TMDB genres endpoint', e);
    }
}

async function testTMDBMovieDetails() {
    try {
        // Test with a known movie ID (Fight Club = 550)
        const url = `https://api.themoviedb.org/3/movie/550?api_key=${TMDB_API_KEY}`;
        const res = await request(url);
        if (res.status === 200) {
            const data = JSON.parse(res.data);
            if (data.title) {
                pass('TMDB movie details', `Got: "${data.title}"`);
            } else {
                fail('TMDB movie details', 'No title in response');
            }
        } else {
            fail('TMDB movie details', `Status: ${res.status}`);
        }
    } catch (e) {
        fail('TMDB movie details', e);
    }
}

async function testServiceWorkerRegistered() {
    try {
        const res = await request(`${BASE_URL}/service-worker.js`);
        if (res.status === 200 && res.data.includes('CACHE_NAME')) {
            pass('Service Worker file exists', 'Contains CACHE_NAME');
        } else if (res.status === 200) {
            pass('Service Worker file exists', 'File accessible');
        } else {
            fail('Service Worker file exists', `Status: ${res.status}`);
        }
    } catch (e) {
        fail('Service Worker file exists', e);
    }
}

// ============ MAIN ============

async function runAllTests() {
    log('\n🎬 MoodReel Smoke Test Suite', 'blue');
    log('━'.repeat(50), 'dim');

    log('\n📡 Connectivity Tests:', 'yellow');
    await testDevServerResponds();
    await testStaticAssets();
    await testServiceWorkerRegistered();

    log('\n🎥 TMDB API Tests:', 'yellow');
    await testTMDBApiConnectivity();
    await testTMDBSearchEndpoint();
    await testTMDBTVEndpoint();
    await testTMDBGenresEndpoint();
    await testTMDBMovieDetails();

    // Summary
    log('\n━'.repeat(50), 'dim');
    log(`\n📊 Results: ${results.passed} passed, ${results.failed} failed`,
        results.failed > 0 ? 'red' : 'green');

    if (results.failed > 0) {
        log('\n❌ Smoke tests FAILED', 'red');
        process.exit(1);
    } else {
        log('\n✅ All smoke tests PASSED', 'green');
        process.exit(0);
    }
}

// Handle server not running gracefully
runAllTests().catch(err => {
    log(`\n❌ Fatal error: ${err.message}`, 'red');
    log('\nMake sure the dev server is running: npm start', 'yellow');
    process.exit(1);
});
