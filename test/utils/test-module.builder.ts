import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { Type } from '@nestjs/common';

export class TestModuleBuilder {
  private providers: any[] = [];
  private controllers: Type<any>[] = [];

  forRoot(provider: Type<any>): this {
    this.providers.push(provider);
    return this;
  }

  withController(controller: Type<any>): this {
    this.controllers.push(controller);
    return this;
  }

  withMock(token: any, mock: any): this {
    this.providers.push({ provide: token, useValue: mock });
    return this;
  }

  withFactory(
    token: any,
    factory: (...args: any[]) => any,
    inject: any[] = [],
  ): this {
    this.providers.push({
      provide: token,
      useFactory: factory,
      inject,
    });
    return this;
  }

  async build(): Promise<TestingModule> {
    const moduleBuilder: TestingModuleBuilder = Test.createTestingModule({
      controllers: this.controllers,
      providers: this.providers,
    });

    return moduleBuilder.compile();
  }
}

export const createTestModule = (): TestModuleBuilder =>
  new TestModuleBuilder();
