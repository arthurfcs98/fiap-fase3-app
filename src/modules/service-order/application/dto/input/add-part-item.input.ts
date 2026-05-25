import { AddServiceOrderPartDto } from '../add-service-order-item.dto';

export class AddPartItemInput {
  readonly orderId: string;
  readonly partId: string;
  readonly quantity: number;

  constructor(props: { orderId: string; partId: string; quantity: number }) {
    this.orderId = props.orderId;
    this.partId = props.partId;
    this.quantity = props.quantity;
  }

  static fromDto(
    orderId: string,
    dto: AddServiceOrderPartDto,
  ): AddPartItemInput {
    return new AddPartItemInput({
      orderId,
      partId: dto.partId,
      quantity: dto.quantity,
    });
  }
}
