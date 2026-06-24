export class IdService {
  generate(): string {
    return crypto.randomUUID()
  }
}
