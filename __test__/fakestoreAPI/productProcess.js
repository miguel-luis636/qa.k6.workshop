import http from 'k6/http';
import { check, sleep, group } from 'k6';

import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

const testConfig = JSON.parse(open('../../env/settings.json'));
const configLoad = JSON.parse(open('../../env/config.load.json'));


export const options = {
  stages: configLoad.STAGES,
  thresholds: configLoad.THRESHOLDS_PROCESS,
};


export default function () {

  const payload = JSON.stringify(testConfig.PRODUCTS.createPayload);

  const updatePayload = JSON.stringify(testConfig.PRODUCTS.updatePayload);

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  let productId;


  group('POST /products', () => {

    const res = http.post(`${testConfig.SETTINGS.baseUrl}/products`, payload, {...params, tags: { endpoint: 'add-product' }, }
    );

    check(res, {
      'POST status is 201': (r) => r.status === 201,
      'POST response < 750ms': (r) => r.timings.duration < 750,
      'POST product criado': (r) => r.json('id') !== undefined,
    });

    productId = res.json().id;
  });

  group('GET /products/:id', () => {

    const res = http.get( `${testConfig.SETTINGS.baseUrl}/products/${productId}`,{ tags: { endpoint: 'get-product' }, }
    );

    check(res, {
      'GET status is 200': (r) => r.status === 200,
      'GET response < 550ms': (r) => r.timings.duration < 550,
    });
  });


  group('PUT /products/:id', () => {

    const res = http.put( `${testConfig.SETTINGS.baseUrl}/products/${productId}`, updatePayload ,{ ...params, tags: { endpoint: 'update-product' },}
    );

    check(res, {
      'PUT status is 200': (r) => r.status === 200,
      'PUT response < 500ms': (r) => r.timings.duration < 500,
      'PUT product atualizado': (r) => r.json('title') === 'QA K6 Updated Product',
    });
  });

  group('DELETE /products/:id', () => {

    const res = http.del(`${testConfig.SETTINGS.baseUrl}/products/${productId}`,null,{ tags: { endpoint: 'delete-product' },}
    );

    check(res, {
      'DELETE status is 200': (r) => r.status === 200,
      'DELETE response < 400ms': (r) => r.timings.duration < 400,
    });
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'results/product-process-report.html': htmlReport(data, {
      title: 'Product Process Performance Report',
      debug: false,
    }),

    stdout: textSummary(data, {
      indent: ' ',
      enableColors: true,
    }),
  };
}