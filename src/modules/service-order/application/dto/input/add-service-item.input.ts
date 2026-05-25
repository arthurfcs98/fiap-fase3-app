import { AddServiceOrderItemDto } from '../add-service-order-item.dto';

export class AddServiceItemInput {
  readonly orderId: string;
  readonly serviceId: string;
  readonly quantity: number;

  constructor(props: { orderId: string; serviceId: string; quantity: number }) {
    this.orderId = props.orderId;
    this.serviceId = props.serviceId;
    this.quantity = props.quantity;
  }

  static fromDto(
    orderId: string,
    dto: AddServiceOrderItemDto,
  ): AddServiceItemInput {
    return new AddServiceItemInput({
      orderId,
      serviceId: dto.serviceId,
      quantity: dto.quantity ?? 1,
    });
  }
}
