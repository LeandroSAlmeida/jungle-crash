import { Round } from '../entities/round';

export interface RoundRepository {
  save(round: Round): Promise<void>;
  findById(id: string): Promise<Round | null>;
  findCurrent(): Promise<Round | null>;
}

export const ROUND_REPOSITORY = Symbol('RoundRepository');
