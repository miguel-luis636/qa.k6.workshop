import http from 'k6/http';
import { check, sleep } from 'k6';

import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

export const options = {
  vus: 20,
  duration: '30s',

  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
    http_req_waiting: ['avg<300'],
    http_req_connecting: ['p(95)<100'],
    checks: ['rate>0.99'],
  },
};

export default function () {

  const res = http.get('https://fakestoreapi.com/products');

  check(res, {
    'status 200': (r) => r.status === 200,
    'response < 500ms': (r) => r.timings.duration < 500,
    'payload valido': (r) => r.body.length > 0,
  });

  sleep(1);
}


export function handleSummary(data) {
  return {

    'results/performance-report.html': htmlReport(data, {
      title: 'Teste de Performance - Fake Store API',
      debug: false,
    }),

    stdout: textSummary(data, {
      indent: ' ',
      enableColors: true,
    }),
  };
}