export enum ServiceOrderStatus {
  RECEIVED = 'RECEIVED',
  IN_DIAGNOSIS = 'IN_DIAGNOSIS',
  AWAITING_APPROVAL = 'AWAITING_APPROVAL',
  AWAITING_START = 'AWAITING_START',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export const SERVICE_ORDER_STATUS_TRANSITIONS: Record<
  ServiceOrderStatus,
  ServiceOrderStatus[]
> = {
  [ServiceOrderStatus.RECEIVED]: [
    ServiceOrderStatus.IN_DIAGNOSIS,
    ServiceOrderStatus.CANCELLED,
  ],
  [ServiceOrderStatus.IN_DIAGNOSIS]: [
    ServiceOrderStatus.AWAITING_APPROVAL,
    ServiceOrderStatus.CANCELLED,
  ],
  [ServiceOrderStatus.AWAITING_APPROVAL]: [
    ServiceOrderStatus.AWAITING_START,
    ServiceOrderStatus.CANCELLED,
  ],
  [ServiceOrderStatus.AWAITING_START]: [
    ServiceOrderStatus.IN_PROGRESS,
    ServiceOrderStatus.CANCELLED,
  ],
  [ServiceOrderStatus.IN_PROGRESS]: [
    ServiceOrderStatus.COMPLETED,
    ServiceOrderStatus.CANCELLED,
  ],
  [ServiceOrderStatus.COMPLETED]: [
    ServiceOrderStatus.DELIVERED,
    ServiceOrderStatus.CANCELLED,
  ],
  [ServiceOrderStatus.DELIVERED]: [],
  [ServiceOrderStatus.CANCELLED]: [],
};

export function canTransitionTo(
  currentStatus: ServiceOrderStatus,
  newStatus: ServiceOrderStatus,
): boolean {
  return SERVICE_ORDER_STATUS_TRANSITIONS[currentStatus].includes(newStatus);
}

export function getStatusLabel(status: ServiceOrderStatus): string {
  const labels: Record<ServiceOrderStatus, string> = {
    [ServiceOrderStatus.RECEIVED]: 'Recebida',
    [ServiceOrderStatus.IN_DIAGNOSIS]: 'Em Diagnóstico',
    [ServiceOrderStatus.AWAITING_APPROVAL]: 'Aguardando Aprovação',
    [ServiceOrderStatus.AWAITING_START]: 'Aguardando Início',
    [ServiceOrderStatus.IN_PROGRESS]: 'Em Execução',
    [ServiceOrderStatus.COMPLETED]: 'Finalizada',
    [ServiceOrderStatus.DELIVERED]: 'Entregue',
    [ServiceOrderStatus.CANCELLED]: 'Cancelada',
  };
  return labels[status];
}
