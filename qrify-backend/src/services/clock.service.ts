export class ClockService {
  now(): Date {
    return new Date()
  }

  nowISO(): string {
    return new Date().toISOString()
  }
}
