/**
 * Interface base para todos os Use Cases da aplicação.
 * Segue o padrão Command/Query do Clean Architecture.
 *
 * @template TInput - Tipo do DTO de entrada
 * @template TOutput - Tipo do DTO de saída
 */
export interface IUseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}
