export declare class Transaction {
  private callbacks
  begin(): void
  end(): void
  private flush
  onComplete(callback: Function): void
}
export declare const afterTransaction: (callback: Function) => void
