import http from 'k6/http';
import { check, sleep, group } from 'k6';

import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

const settings = JSON.parse(open('../../env/settings.json'));
const config   = JSON.parse(open('../../env/config.stress.json'));

export const options = {
  scenarios:  config.SCENARIOS,
  thresholds: config.THRESHOLDS_USERS,
};

const BASE_URL = settings.SETTINGS.baseUrl;
const HEADERS  = { headers: settings.SETTINGS.headers };
const CREATE_PAYLOAD = JSON.stringify(settings.USERS.createPayload);
const UPDATE_PAYLOAD = JSON.stringify(settings.USERS.updatePayload);

export default function () {
  let userId;

  group('GET /users', () => {
    const res = http.get(`${BASE_URL}/users`,{ tags: { endpoint: 'get-users' } },);

    check(res, {
      'GET USERS status 200':       (r) => r.status === 200,
      'GET USERS response < 500ms': (r) => r.timings.duration < 500,
      'GET USERS payload valido':   (r) => Array.isArray(r.json()) && r.json().length > 0,
    });
  });

  group('POST /users', () => {
    const res = http.post(`${BASE_URL}/users`,CREATE_PAYLOAD,{ ...HEADERS, tags: { endpoint: 'add-user' } },
    );

    check(res, {
      'POST USER status 201':       (r) => r.status === 201,
      'POST USER response < 700ms': (r) => r.timings.duration < 700,
      'POST USER id retornado':     (r) => r.json('id') !== undefined,
    });

    userId = res.json('id');
  });

  
  group('GET /users/:id', () => {
    const targetId = userId || 1;

    const res = http.get(`${BASE_URL}/users/${targetId}`,{ tags: { endpoint: 'get-user-id' } },);

    check(res, {
      'GET USER ID status 200':       (r) => r.status === 200,
      'GET USER ID response < 500ms': (r) => r.timings.duration < 500,
      'GET USER ID tem username':     (r) => r.json('username') !== undefined,
    });
  });

  group('PUT /users/:id', () => {
    const targetId = userId || 1;

    const res = http.put(`${BASE_URL}/users/${targetId}`,UPDATE_PAYLOAD, { ...HEADERS, tags: { endpoint: 'update-user' } },
    );

    check(res, {
      'PUT USER status 200':          (r) => r.status === 200,
      'PUT USER response < 700ms':    (r) => r.timings.duration < 700,
      'PUT USER username atualizado': (r) => r.json().username === 'qa_k6_updated',
    });
  });

  group('DELETE /users/:id', () => {
    const targetId = userId || 1;

    const res = http.del(`${BASE_URL}/users/${targetId}`, null, { tags: { endpoint: 'delete-user' } },);

    check(res, {
      'DELETE USER status 200':       (r) => r.status === 200,
      'DELETE USER response < 500ms': (r) => r.timings.duration < 500,
    });
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'results/user-stress-report.html': htmlReport(data, {
      title: 'User Stress Test Report',
      debug: false,
    }),
    stdout: textSummary(data, {
      indent: ' ',
      enableColors: true,
    }),
  };
}