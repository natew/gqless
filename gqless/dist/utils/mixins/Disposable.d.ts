export declare class Disposable {
  private disposers
  protected disposed: boolean
  addDisposer(...disposers: any[]): () => void
  deleteDiposer(...disposers: any[]): void
  dispose(): void
}
