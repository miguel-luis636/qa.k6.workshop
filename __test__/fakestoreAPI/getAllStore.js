import http from 'k6/http';
import { check, sleep, group } from 'k6';

import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

export const options = {
    stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 40 },
    { duration: '30s', target: 0 },
  ],


  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
    http_req_waiting: ['avg<300'],
    http_req_connecting: ['p(95)<100'],
    checks: ['rate>0.99'],
  },
};

const BASE_URL = 'https://fakestoreapi.com';

export default function () {

  group('GET /products', () => {

    const res = http.get(`${BASE_URL}/products`, {
      tags: { endpoint: '/products' },
    });

    check(res, {
      'GET /products - status 200': (r) => r.status === 200,
      'GET /products - response < 500ms': (r) => r.timings.duration < 500,
      'GET /products - payload valido': (r) => r.body.length > 0,
    });
  });


  group('GET /carts', () => {

    const res = http.get(`${BASE_URL}/carts`, {
      tags: { endpoint: '/carts' },
    });

    check(res, {
      'GET /carts - status 200': (r) => r.status === 200,
      'GET /carts - response < 500ms': (r) => r.timings.duration < 500,
      'GET /carts - payload valido': (r) => r.body.length > 0,
    });
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