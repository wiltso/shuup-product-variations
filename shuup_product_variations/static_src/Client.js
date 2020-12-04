import axios from 'axios';

const Client = axios.create({
  timeout: 30000, // 30 secs
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
  maxRedirects: 0, // never redirect, otherwise the JWT won't be passed through
});

export default Client;
