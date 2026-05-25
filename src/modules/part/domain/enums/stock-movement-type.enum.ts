export enum StockMovementType {
  IN = 'IN', // Entrada de estoque
  OUT = 'OUT', // Saída de estoque (uso direto)
  RESERVE = 'RESERVE', // Reserva para OS
  RELEASE = 'RELEASE', // Liberação de reserva
  ADJUSTMENT = 'ADJUSTMENT', // Ajuste de inventário
}
