import { ServiceOrderStatus } from '../../../domain/enums/service-order-status.enum';

export class FindServiceOrderByIdInput {
  readonly id: string;

  constructor(id: string) {
    this.id = id;
  }
}

export class FindServiceOrderByOrderNumberInput {
  readonly orderNumber: string;

  constructor(orderNumber: string) {
    this.orderNumber = orderNumber;
  }
}

export class ListServiceOrdersInput {
  readonly page: number;
  readonly limit: number;
  readonly status?: ServiceOrderStatus;
  readonly customerId?: string;

  constructor(props: {
    page?: number;
    limit?: number;
    status?: ServiceOrderStatus;
    customerId?: string;
  }) {
    this.page = props.page ?? 1;
    this.limit = props.limit ?? 10;
    this.status = props.status;
    this.customerId = props.customerId;
  }
}
