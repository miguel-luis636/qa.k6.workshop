import http from 'k6/http';


export default function () {
    const baseURL = 'https://fakestoreapi.com';
    const payload = null;
    const params = null;


    http.get(`${baseURL}/products`);
}