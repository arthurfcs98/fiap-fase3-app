import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { TestApp } from './test-app';

export class ApiClient {
  constructor(private readonly app: INestApplication) {}

  private getAuthHeader(): Record<string, string> {
    const token = TestApp.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async post(url: string, body: object, authenticated = true) {
    const req = request(this.app.getHttpServer()).post(url).send(body);
    if (authenticated) {
      req.set(this.getAuthHeader());
    }
    return req;
  }

  async get(url: string, authenticated = true) {
    const req = request(this.app.getHttpServer()).get(url);
    if (authenticated) {
      req.set(this.getAuthHeader());
    }
    return req;
  }

  async put(url: string, body: object, authenticated = true) {
    const req = request(this.app.getHttpServer()).put(url).send(body);
    if (authenticated) {
      req.set(this.getAuthHeader());
    }
    return req;
  }

  async patch(url: string, body: object, authenticated = true) {
    const req = request(this.app.getHttpServer()).patch(url).send(body);
    if (authenticated) {
      req.set(this.getAuthHeader());
    }
    return req;
  }

  async delete(url: string, authenticated = true) {
    const req = request(this.app.getHttpServer()).delete(url);
    if (authenticated) {
      req.set(this.getAuthHeader());
    }
    return req;
  }
}
