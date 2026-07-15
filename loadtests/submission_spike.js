import http from 'k6/http';
import { check, sleep } from 'k6';
import encoding from 'k6/encoding';

// Target host can be overridden via environment variable (__ENV.API_URL).
// When running locally with k6 CLI, defaults to http://localhost:8080/api/v1.
// When running via `docker run --rm -i -e API_URL="http://host.docker.internal:8080/api/v1" grafana/k6 run - < loadtests/submission_spike.js`,
// it will use host.docker.internal to reach the host API Gateway from inside the container.
const API_URL = __ENV.API_URL || 'http://localhost:8080/api/v1';

// Spike test configuration:
// - Ramp up to 500 Virtual Users (VUs) over 30 seconds
// - Sustain 500 VUs for 60 seconds
// - Ramp down to 0 VUs over 10 seconds
export const options = {
  stages: [
    { duration: '30s', target: 500 },
    { duration: '60s', target: 500 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    // 99% of submissions queued within 2.5 seconds (SLO alignment)
    http_req_duration: ['p(99)<2500'],
    http_req_failed: ['rate<0.01'],
  },
};

// Base64 encode a safe Python script: `def solve(): print("ok")`
const SAFE_PYTHON_CODE = 'def solve():\n    print("ok")\n\nif __name__ == "__main__":\n    solve()\n';
const BASE64_CODE = encoding.b64encode(SAFE_PYTHON_CODE);

// Problem ID for Two Sum (a0000000-0000-4000-a000-000000000001) seeded in init.sql
const PROBLEM_ID = 'a0000000-0000-4000-a000-000000000001';

/**
 * setup() runs exactly once before VUs start executing.
 * It authenticates against /auth/login to retrieve a valid JWT token.
 * We also attempt a proactive registration just in case the test user doesn't exist yet on a fresh DB.
 */
export function setup() {
  const credentials = {
    username: 'loadtest_student',
    email: 'loadtest@u-aizu.ac.jp',
    password: 'password123',
  };

  const headers = { 'Content-Type': 'application/json' };

  // Proactively register our load test user (ignore 400/409 if already registered)
  http.post(`${API_URL}/auth/register`, JSON.stringify(credentials), { headers });

  // Authenticate to retrieve JWT token
  const loginRes = http.post(`${API_URL}/auth/login`, JSON.stringify({
    username: credentials.username,
    password: credentials.password,
  }), { headers });

  if (loginRes.status !== 200) {
    throw new Error(`[setup] Authentication failed with status ${loginRes.status}: ${loginRes.body}`);
  }

  const token = loginRes.json('token');
  if (!token) {
    throw new Error('[setup] Failed to extract JWT token from login response');
  }

  return { token };
}

/**
 * default() runs repeatedly for each VU across the defined stages.
 */
export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  const payload = JSON.stringify({
    problem_id: PROBLEM_ID,
    language: 'python3',
    code_base64: BASE64_CODE,
  });

  // Perform POST request to queue the submission
  const res = http.post(`${API_URL}/submissions`, payload, { headers });

  // Strict Rule: Throw an error if the API returns 5xx errors (indicates Go API Gateway or RabbitMQ is buckling)
  if (res.status >= 500) {
    throw new Error(`Server Error (Status ${res.status}): API Gateway or RabbitMQ cluster buckling under load - ${res.body}`);
  }

  // Check verifying that the RabbitMQ producer succeeded (Status 201 Created or 202 Accepted)
  check(res, {
    'submission successfully enqueued (201/202)': (r) => r.status === 201 || r.status === 202,
  });

  // Simulate realistic student pacing between attempts
  sleep(1);
}
