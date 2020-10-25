export declare const uniquify: (
  desiredName: string,
  isTaken: (name: string) => boolean,
  uniquify?: (name: string, id: number) => string
) => string
