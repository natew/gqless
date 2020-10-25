export declare const usePoll: (
  data: any,
  interval: number,
  initiallyPolling?: boolean
) => readonly [boolean, (poll?: boolean) => void]
