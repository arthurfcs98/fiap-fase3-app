import {
  ServiceOrderStatus,
  canTransitionTo,
  getStatusLabel,
} from '@/modules/service-order/domain/enums/service-order-status.enum';

describe('ServiceOrderStatus Enum', () => {
  describe('canTransitionTo', () => {
    it('should allow RECEIVED to IN_DIAGNOSIS', () => {
      expect(
        canTransitionTo(
          ServiceOrderStatus.RECEIVED,
          ServiceOrderStatus.IN_DIAGNOSIS,
        ),
      ).toBe(true);
    });

    it('should allow RECEIVED to CANCELLED', () => {
      expect(
        canTransitionTo(
          ServiceOrderStatus.RECEIVED,
          ServiceOrderStatus.CANCELLED,
        ),
      ).toBe(true);
    });

    it('should not allow RECEIVED to IN_PROGRESS', () => {
      expect(
        canTransitionTo(
          ServiceOrderStatus.RECEIVED,
          ServiceOrderStatus.IN_PROGRESS,
        ),
      ).toBe(false);
    });

    it('should allow IN_DIAGNOSIS to AWAITING_APPROVAL', () => {
      expect(
        canTransitionTo(
          ServiceOrderStatus.IN_DIAGNOSIS,
          ServiceOrderStatus.AWAITING_APPROVAL,
        ),
      ).toBe(true);
    });

    it('should allow AWAITING_APPROVAL to AWAITING_START', () => {
      expect(
        canTransitionTo(
          ServiceOrderStatus.AWAITING_APPROVAL,
          ServiceOrderStatus.AWAITING_START,
        ),
      ).toBe(true);
    });

    it('should allow AWAITING_APPROVAL to CANCELLED', () => {
      expect(
        canTransitionTo(
          ServiceOrderStatus.AWAITING_APPROVAL,
          ServiceOrderStatus.CANCELLED,
        ),
      ).toBe(true);
    });

    it('should allow AWAITING_START to IN_PROGRESS', () => {
      expect(
        canTransitionTo(
          ServiceOrderStatus.AWAITING_START,
          ServiceOrderStatus.IN_PROGRESS,
        ),
      ).toBe(true);
    });

    it('should allow AWAITING_START to CANCELLED', () => {
      expect(
        canTransitionTo(
          ServiceOrderStatus.AWAITING_START,
          ServiceOrderStatus.CANCELLED,
        ),
      ).toBe(true);
    });

    it('should allow IN_PROGRESS to COMPLETED', () => {
      expect(
        canTransitionTo(
          ServiceOrderStatus.IN_PROGRESS,
          ServiceOrderStatus.COMPLETED,
        ),
      ).toBe(true);
    });

    it('should allow COMPLETED to DELIVERED', () => {
      expect(
        canTransitionTo(
          ServiceOrderStatus.COMPLETED,
          ServiceOrderStatus.DELIVERED,
        ),
      ).toBe(true);
    });

    it('should not allow DELIVERED to any other status', () => {
      expect(
        canTransitionTo(
          ServiceOrderStatus.DELIVERED,
          ServiceOrderStatus.CANCELLED,
        ),
      ).toBe(false);
      expect(
        canTransitionTo(
          ServiceOrderStatus.DELIVERED,
          ServiceOrderStatus.RECEIVED,
        ),
      ).toBe(false);
    });

    it('should not allow CANCELLED to any other status', () => {
      expect(
        canTransitionTo(
          ServiceOrderStatus.CANCELLED,
          ServiceOrderStatus.RECEIVED,
        ),
      ).toBe(false);
    });
  });

  describe('getStatusLabel', () => {
    it('should return correct label for RECEIVED', () => {
      expect(getStatusLabel(ServiceOrderStatus.RECEIVED)).toBe('Recebida');
    });

    it('should return correct label for IN_DIAGNOSIS', () => {
      expect(getStatusLabel(ServiceOrderStatus.IN_DIAGNOSIS)).toBe(
        'Em Diagnóstico',
      );
    });

    it('should return correct label for AWAITING_APPROVAL', () => {
      expect(getStatusLabel(ServiceOrderStatus.AWAITING_APPROVAL)).toBe(
        'Aguardando Aprovação',
      );
    });

    it('should return correct label for AWAITING_START', () => {
      expect(getStatusLabel(ServiceOrderStatus.AWAITING_START)).toBe(
        'Aguardando Início',
      );
    });

    it('should return correct label for IN_PROGRESS', () => {
      expect(getStatusLabel(ServiceOrderStatus.IN_PROGRESS)).toBe(
        'Em Execução',
      );
    });

    it('should return correct label for COMPLETED', () => {
      expect(getStatusLabel(ServiceOrderStatus.COMPLETED)).toBe('Finalizada');
    });

    it('should return correct label for DELIVERED', () => {
      expect(getStatusLabel(ServiceOrderStatus.DELIVERED)).toBe('Entregue');
    });

    it('should return correct label for CANCELLED', () => {
      expect(getStatusLabel(ServiceOrderStatus.CANCELLED)).toBe('Cancelada');
    });
  });
});
