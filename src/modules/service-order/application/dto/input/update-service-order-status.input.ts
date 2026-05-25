import { ServiceOrderStatus } from '../../../domain/enums/service-order-status.enum';
import { UpdateServiceOrderStatusDto } from '../update-service-order-status.dto';

export class UpdateServiceOrderStatusInput {
  readonly id: string;
  readonly status: ServiceOrderStatus;
  readonly notes?: string;

  constructor(props: {
    id: string;
    status: ServiceOrderStatus;
    notes?: string;
  }) {
    this.id = props.id;
    this.status = props.status;
    this.notes = props.notes;
  }

  static fromDto(
    id: string,
    dto: UpdateServiceOrderStatusDto,
  ): UpdateServiceOrderStatusInput {
    return new UpdateServiceOrderStatusInput({
      id,
      status: dto.status,
      notes: dto.notes,
    });
  }
}
