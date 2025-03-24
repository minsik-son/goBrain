// src/@types/luxon.d.ts
declare module 'luxon' {
    export class DateTime {
      static fromISO(iso: string): DateTime;
      static local(): DateTime;
      static now(): DateTime;
      static fromMillis(milliseconds: number): DateTime;
      plus(duration: { [key: string]: number }): DateTime;
      toISO(): string;
      toFormat(format: string): string;
      // 필요한 다른 메서드 및 속성을 추가할 수 있습니다.
    }
  }