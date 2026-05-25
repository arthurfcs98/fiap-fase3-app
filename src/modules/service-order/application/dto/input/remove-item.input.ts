export class RemoveServiceItemInput {
  readonly orderId: string;
  readonly itemId: string;

  constructor(props: { orderId: string; itemId: string }) {
    this.orderId = props.orderId;
    this.itemId = props.itemId;
  }
}

export class RemovePartItemInput {
  readonly orderId: string;
  readonly itemId: string;

  constructor(props: { orderId: string; itemId: string }) {
    this.orderId = props.orderId;
    this.itemId = props.itemId;
  }
}
