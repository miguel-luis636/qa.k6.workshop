import http from 'k6/http';
import { check, sleep } from 'k6';

import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

const settings = JSON.parse(open('../../env/settings.json'));
const config   = JSON.parse(open('../../env/config.load.json'));

export const options = {
  stages:     config.STAGES,
  thresholds: config.THRESHOLDS_GET,
};

const BASE_URL = settings.SETTINGS.baseUrl;
const HEADERS  = { headers: settings.SETTINGS.headers };
const LOGIN_PAYLOAD = JSON.stringify(settings.AUTH.loginPayload);

export default function () {
  const res = http.post(`${BASE_URL}/auth/login`,LOGIN_PAYLOAD, HEADERS, );

  check(res, {
    'POST LOGIN status 201':      (r) => r.status === 201,
    'POST LOGIN response < 600ms': (r) => r.timings.duration < 600,
    'POST LOGIN token retornado': (r) => r.json('token') !== undefined,
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'results/auth-report.html': htmlReport(data, {
      title: 'Auth Login Performance Report',
      debug: false,
    }),
    stdout: textSummary(data, {
      indent: ' ',
      enableColors: true,
    }),
  };
}