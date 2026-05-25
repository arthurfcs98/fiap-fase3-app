/**
 * DTO genérico para respostas paginadas.
 *
 * @template T - Tipo dos itens na lista
 */
export class PaginatedOutput<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;

  constructor(props: {
    data: T[];
    total: number;
    page: number;
    limit: number;
  }) {
    this.data = props.data;
    this.total = props.total;
    this.page = props.page;
    this.limit = props.limit;
    this.totalPages = Math.ceil(props.total / props.limit);
  }
}
