import { CreateServiceOrderDto } from '../create-service-order.dto';

export class CreateServiceOrderServiceInput {
  readonly serviceId: string;
  readonly quantity: number;

  constructor(props: { serviceId: string; quantity: number }) {
    this.serviceId = props.serviceId;
    this.quantity = props.quantity;
  }
}

export class CreateServiceOrderPartInput {
  readonly partId: string;
  readonly quantity: number;

  constructor(props: { partId: string; quantity: number }) {
    this.partId = props.partId;
    this.quantity = props.quantity;
  }
}

export class CreateServiceOrderInput {
  readonly customerId: string;
  readonly vehicleId: string;
  readonly services: CreateServiceOrderServiceInput[];
  readonly parts: CreateServiceOrderPartInput[];
  readonly observations?: string;

  constructor(props: {
    customerId: string;
    vehicleId: string;
    services?: CreateServiceOrderServiceInput[];
    parts?: CreateServiceOrderPartInput[];
    observations?: string;
  }) {
    this.customerId = props.customerId;
    this.vehicleId = props.vehicleId;
    this.services = props.services ?? [];
    this.parts = props.parts ?? [];
    this.observations = props.observations;
  }

  static fromDto(dto: CreateServiceOrderDto): CreateServiceOrderInput {
    return new CreateServiceOrderInput({
      customerId: dto.customerId,
      vehicleId: dto.vehicleId,
      services:
        dto.services?.map(
          (s) =>
            new CreateServiceOrderServiceInput({
              serviceId: s.serviceId,
              quantity: s.quantity ?? 1,
            }),
        ) ?? [],
      parts:
        dto.parts?.map(
          (p) =>
            new CreateServiceOrderPartInput({
              partId: p.partId,
              quantity: p.quantity,
            }),
        ) ?? [],
      observations: dto.observations,
    });
  }
}
