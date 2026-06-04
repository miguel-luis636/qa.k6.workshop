import http from 'k6/http';
import { check, sleep, group } from 'k6';

import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 5 },
    { duration: '20s', target: 0 },
  ],

  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<750'],
    checks: ['rate>0.99'],

    'http_req_duration{endpoint:add-product}': ['p(95)<500'],
    'http_req_duration{endpoint:get-product}': ['p(95)<400'],
    'http_req_duration{endpoint:update-product}': ['p(95)<400'],
    'http_req_duration{endpoint:delete-product}': ['p(95)<350'],
  },
};

const BASE_URL = 'https://fakestoreapi.com';

export default function () {

  const payload = JSON.stringify({
    title: 'QA K6 Product',
    price: 99.99,
    description: 'Produto criado em teste de performance',
    image: 'https://i.pravatar.cc',
    category: 'electronic',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  let productId;


  group('POST /products', () => {

    const res = http.post(`${BASE_URL}/products`, payload, {...params, tags: { endpoint: 'add-product' }, }
    );

    check(res, {
      'POST status is 201': (r) => r.status === 201,
      'POST response < 750ms': (r) => r.timings.duration < 750,
      'POST product criado': (r) => r.json('id') !== undefined,
    });

    productId = res.json().id;
  });

  group('GET /products/:id', () => {

    const res = http.get( `${BASE_URL}/products/${productId}`,{ tags: { endpoint: 'get-product' }, }
    );

    check(res, {
      'GET status is 200': (r) => r.status === 200,
      'GET response < 550ms': (r) => r.timings.duration < 550,
    });
  });


  group('PUT /products/:id', () => {

    const updatedPayload = JSON.stringify({
      title: 'QA K6 Updated Product',
      price: 150.00,
      description: 'Produto atualizado',
      image: 'https://i.pravatar.cc',
      category: 'electronic',
    });

    const res = http.put( `${BASE_URL}/products/${productId}`, updatedPayload,{ ...params, tags: { endpoint: 'update-product' },}
    );

    check(res, {
      'PUT status is 200': (r) => r.status === 200,
      'PUT response < 500ms': (r) => r.timings.duration < 500,
      'PUT product atualizado': (r) => r.json('title') === 'QA K6 Updated Product',
    });
  });

  group('DELETE /products/:id', () => {

    const res = http.del(`${BASE_URL}/products/${productId}`,null,{ tags: { endpoint: 'delete-product' },}
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