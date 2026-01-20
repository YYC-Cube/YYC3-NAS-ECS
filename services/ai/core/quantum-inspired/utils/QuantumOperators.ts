/**
 * @file QuantumOperators.ts
 * @description 量子操作符 - 实现基本量子门操作
 * @module core/quantum-inspired/utils
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-06
 */

import { QubitState } from './QubitEncoding';

export type QuantumGate = (qubit: QubitState) => QubitState;

export class QuantumOperators {
  static pauliX: QuantumGate = (qubit: QubitState): QubitState => {
    return {
      alpha: qubit.beta,
      beta: qubit.alpha
    };
  };

  static pauliY: QuantumGate = (qubit: QubitState): QubitState => {
    return {
      alpha: -qubit.beta,
      beta: qubit.alpha
    };
  };

  static pauliZ: QuantumGate = (qubit: QubitState): QubitState => {
    return {
      alpha: qubit.alpha,
      beta: -qubit.beta
    };
  };

  static hadamard: QuantumGate = (qubit: QubitState): QubitState => {
    const sqrt2 = Math.sqrt(2);
    return {
      alpha: (qubit.alpha + qubit.beta) / sqrt2,
      beta: (qubit.alpha - qubit.beta) / sqrt2
    };
  };

  static phaseShift(angle: number): QuantumGate {
    return (qubit: QubitState): QubitState => {
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);
      return {
        alpha: qubit.alpha * cosAngle,
        beta: qubit.beta * cosAngle
      };
    };
  }

  static rotationX(theta: number): QuantumGate {
    return (qubit: QubitState): QubitState => {
      const cos = Math.cos(theta / 2);
      const sin = Math.sin(theta / 2);
      return {
        alpha: cos * qubit.alpha,
        beta: -sin * qubit.beta
      };
    };
  }

  static rotationY(theta: number): QuantumGate {
    return (qubit: QubitState): QubitState => {
      const cos = Math.cos(theta / 2);
      const sin = Math.sin(theta / 2);
      return {
        alpha: cos * qubit.alpha - sin * qubit.beta,
        beta: sin * qubit.alpha + cos * qubit.beta
      };
    };
  }

  static rotationZ(theta: number): QuantumGate {
    return (qubit: QubitState): QubitState => {
      const cos = Math.cos(theta / 2);
      const sin = Math.sin(theta / 2);
      return {
        alpha: cos * qubit.alpha - sin * qubit.beta,
        beta: sin * qubit.alpha + cos * qubit.beta
      };
    };
  }

  static controlledNot(control: QubitState, target: QubitState): QubitState {
    const controlValue = Math.random() < control.alpha * control.alpha ? 0 : 1;
    if (controlValue === 1) {
      return {
        alpha: target.beta,
        beta: target.alpha
      };
    }
    return { alpha: target.alpha, beta: target.beta };
  }

  static swap(qubit1: QubitState, qubit2: QubitState): [QubitState, QubitState] {
    return [
      { alpha: qubit2.alpha, beta: qubit2.beta },
      { alpha: qubit1.alpha, beta: qubit1.beta }
    ];
  }

  static compose(gate1: QuantumGate, gate2: QuantumGate): QuantumGate {
    return (qubit: QubitState): QubitState => {
      return gate2(gate1(qubit));
    };
  }

  static power(gate: QuantumGate, exponent: number): QuantumGate {
    return (qubit: QubitState): QubitState => {
      let result = qubit;
      for (let i = 0; i < exponent; i++) {
        result = gate(result);
      }
      return result;
    };
  }

  static applySequence(qubit: QubitState, gates: QuantumGate[]): QubitState {
    return gates.reduce((acc, gate) => gate(acc), qubit);
  }

  static applyToMultiple(qubits: QubitState[], gate: QuantumGate, indices: number[]): QubitState[] {
    const result = [...qubits];
    indices.forEach(index => {
      if (index >= 0 && index < result.length) {
        result[index] = gate(result[index]);
      }
    });
    return result;
  }

  static applyToAll(qubits: QubitState[], gate: QuantumGate): QubitState[] {
    return qubits.map(qubit => gate(qubit));
  }

  static entangle(qubit1: QubitState, qubit2: QubitState): [QubitState, QubitState] {
    const superposed1 = this.hadamard(qubit1);
    const superposed2 = this.hadamard(qubit2);
    return [superposed1, superposed2];
  }

  static bellState(): [QubitState, QubitState] {
    const qubit1 = { alpha: 1 / Math.sqrt(2), beta: 0 };
    const qubit2 = { alpha: 0, beta: 1 / Math.sqrt(2) };
    return [qubit1, qubit2];
  }

  static ghzState(numQubits: number): QubitState[] {
    const amplitude = 1 / Math.sqrt(2);
    const qubits: QubitState[] = [];
    for (let i = 0; i < numQubits; i++) {
      qubits.push({ alpha: amplitude, beta: amplitude });
    }
    return qubits;
  }

  static measureInBasis(qubit: QubitState, basis: QuantumGate): number {
    const transformed = basis(qubit);
    const probabilityZero = transformed.alpha * transformed.alpha;
    return Math.random() < probabilityZero ? 0 : 1;
  }
}