// Java-compatible Random + String.hashCode implementations.
// Uses BigInt to mimic Java's 48-bit linear congruential generator exactly.

const MULT = 0x5DEECE66Dn;
const ADDEND = 0xBn;
const MASK = (1n << 48n) - 1n;

export class JavaRandom {
  private seed: bigint;

  constructor(seed: bigint | number) {
    const s = typeof seed === "bigint" ? seed : BigInt(seed);
    this.seed = (s ^ MULT) & MASK;
  }

  private next(bits: number): number {
    this.seed = (this.seed * MULT + ADDEND) & MASK;
    // Java: (int)(seed >>> (48 - bits))
    const shifted = this.seed >> BigInt(48 - bits);
    // Convert to signed 32-bit int
    const n = Number(shifted & 0xFFFFFFFFn);
    return n | 0;
  }

  /** Returns next int in [0, bound) matching java.util.Random#nextInt(int). */
  nextInt(bound: number): number {
    if (bound <= 0) throw new Error("bound must be positive");
    if ((bound & -bound) === bound) {
      // Power of two
      return Number((BigInt(bound) * BigInt(this.next(31))) >> 31n);
    }
    let bits: number;
    let val: number;
    do {
      bits = this.next(31);
      val = bits % bound;
    } while (bits - val + (bound - 1) < 0);
    return val;
  }

  /** Byte in [0, 256). */
  nextByte(): number {
    return this.nextInt(256);
  }
}

/** Java String.hashCode(): 32-bit signed, h = 31*h + char. */
export function javaHashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return h;
}

/** Seed a JavaRandom from a password string (Java-compatible). */
export function rngFromPassword(password: string): JavaRandom {
  return new JavaRandom(BigInt(javaHashCode(password)));
}
