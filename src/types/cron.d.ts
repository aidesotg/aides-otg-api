declare module 'cron' {
  export class CronJob {
    constructor(
      cronTime: string,
      onTick: () => void,
      onComplete?: () => void,
      start?: boolean,
      timeZone?: string,
      context?: any,
      runOnInit?: boolean,
    );
    start(): void;
    stop(): void;
  }
}
