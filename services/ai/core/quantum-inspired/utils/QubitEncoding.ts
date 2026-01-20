/**
 * @file QubitEncoding.ts
 * @description 量子比特编码 - 实现量子比特的表示和编码
 * @module core/quantum-inspired/utils
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-06
 */

export interface QubitState {
  alpha: number;
  beta: number;
}

export class QubitEncoding {
  private static readonly EPSILON = 1e-10;

  static createQubit(alpha: number, beta: number): QubitState {
    const norm = Math.sqrt(alpha * alpha + beta * beta);
    if (norm < this.EPSILON) {
      throw new Error('量子比特状态不能为零向量');
    }
    return {
      alpha: alpha / norm,
      beta: beta / norm
    };
  }

  static createZeroState(): QubitState {
    return { alpha: 1, beta: 0 };
  }

  static createOneState(): QubitState {
    return { alpha: 0, beta: 1 };
  }

  static createSuperposition(): QubitState {
    return { alpha: 1 / Math.sqrt(2), beta: 1 / Math.sqrt(2) };
  }

  static measure(qubit: QubitState): number {
    const probabilityZero = qubit.alpha * qubit.alpha;
    return Math.random() < probabilityZero ? 0 : 1;
  }

  static measureMultiple(qubits: QubitState[]): number[] {
    return qubits.map(qubit => this.measure(qubit));
  }

  static tensorProduct(qubit1: QubitState, qubit2: QubitState): QubitState[] {
    return [
      { alpha: qubit1.alpha * qubit2.alpha, beta: 0 },
      { alpha: qubit1.alpha * qubit2.beta, beta: 0 },
      { alpha: qubit1.beta * qubit2.alpha, beta: 0 },
      { alpha: qubit1.beta * qubit2.beta, beta: 0 }
    ];
  }

  static encodeBinary(binary: string): QubitState[] {
    return binary.split('').map(bit => {
      if (bit === '0') {
        return this.createZeroState();
      } else if (bit === '1') {
        return this.createOneState();
      } else {
        throw new Error(`无效的二进制位: ${bit}`);
      }
    });
  }

  static decodeToBinary(qubits: QubitState[]): string {
    return qubits.map(qubit => this.measure(qubit).toString()).join('');
  }

  static encodeReal(value: number, numBits: number): QubitState[] {
    const scaled = Math.floor(value * (1 << numBits));
    const binary = scaled.toString(2).padStart(numBits, '0');
    return this.encodeBinary(binary);
  }

  static decodeToReal(qubits: QubitState[]): number {
    const binary = this.decodeToBinary(qubits);
    return parseInt(binary, 2) / (1 << qubits.length);
  }

  static applyPhase(qubit: QubitState, phase: number): QubitState {
    return {
      alpha: qubit.alpha * Math.cos(phase),
      beta: qubit.beta * Math.cos(phase)
    };
  }

  static normalize(qubit: QubitState): QubitState {
    const norm = Math.sqrt(qubit.alpha * qubit.alpha + qubit.beta * qubit.beta);
    return {
      alpha: qubit.alpha / norm,
      beta: qubit.beta / norm
    };
  }

  static fidelity(qubit1: QubitState, qubit2: QubitState): number {
    const innerProduct = qubit1.alpha * qubit2.alpha + qubit1.beta * qubit2.beta;
    return innerProduct * innerProduct;
  }

  static distance(qubit1: QubitState, qubit2: QubitState): number {
    return 1 - this.fidelity(qubit1, qubit2);
  }

  static clone(qubit: QubitState): QubitState {
    return { alpha: qubit.alpha, beta: qubit.beta };
  }

  static equals(qubit1: QubitState, qubit2: QubitState): boolean {
    return this.distance(qubit1, qubit2) < this.EPSILON;
  }
}