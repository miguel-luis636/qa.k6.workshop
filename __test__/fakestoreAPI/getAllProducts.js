import http from 'k6/http';
import { check, sleep } from 'k6';

import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

const testConfig = JSON.parse(open('../../env/settings.json'));
const configLoad = JSON.parse(open('../../env/config.load.json'));

export const options = {
  stages: configLoad.STAGES,
  thresholds: configLoad.THRESHOLDS_GET,
};

export default function () {

  const res = http.get(`${testConfig.SETTINGS.baseUrl}/products`);

  check(res, {
    'status 200': (r) => r.status === 200,
    'response < 600ms': (r) => r.timings.duration < 600,
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