import { describe, it, expect, beforeEach } from 'vitest';
import {
  QuantumInspiredAlgorithms,
  QuantumGeneticAlgorithm,
  QuantumAnnealing,
  QuantumNeuralNetwork,
  QubitEncoding,
  QuantumOperators,
  QuantumOptimization
} from '../QuantumInspiredAlgorithms';
import { OptimizationProblem } from '../utils/QuantumOptimization';

describe('QubitEncoding', () => {
  it('应该正确创建量子比特', () => {
    const qubit = QubitEncoding.createQubit(1, 0);
    expect(qubit.alpha).toBeCloseTo(1);
    expect(qubit.beta).toBeCloseTo(0);
  });

  it('应该归一化量子比特状态', () => {
    const qubit = QubitEncoding.createQubit(2, 2);
    const expected = 1 / Math.sqrt(2);
    expect(qubit.alpha).toBeCloseTo(expected);
    expect(qubit.beta).toBeCloseTo(expected);
  });

  it('应该正确测量量子比特', () => {
    const qubit = QubitEncoding.createQubit(1, 0);
    const measured = QubitEncoding.measure(qubit);
    expect([0, 1]).toContain(measured);
  });

  it('应该正确编码数据', () => {
    const data = [0.5, -0.5, 0];
    const encoded = QubitEncoding.encodeData(data);
    expect(encoded).toHaveLength(data.length);
    encoded.forEach(qubit => {
      const norm = Math.sqrt(qubit.alpha ** 2 + qubit.beta ** 2);
      expect(norm).toBeCloseTo(1);
    });
  });

  it('应该正确解码量子比特', () => {
    const data = [0.5, -0.5, 0];
    const encoded = QubitEncoding.encodeData(data);
    const decoded = QubitEncoding.decodeQubits(encoded);
    expect(decoded).toHaveLength(data.length);
    decoded.forEach((value, index) => {
      expect(value).toBeCloseTo(data[index], 1);
    });
  });
});

describe('QuantumOperators', () => {
  it('应该正确应用Pauli-X门', () => {
    const qubit = QubitEncoding.createQubit(1, 0);
    const transformed = QuantumOperators.pauliX(qubit);
    expect(transformed.alpha).toBeCloseTo(0);
    expect(transformed.beta).toBeCloseTo(1);
  });

  it('应该正确应用Hadamard门', () => {
    const qubit = QubitEncoding.createQubit(1, 0);
    const transformed = QuantumOperators.hadamard(qubit);
    const expected = 1 / Math.sqrt(2);
    expect(transformed.alpha).toBeCloseTo(expected);
    expect(transformed.beta).toBeCloseTo(expected);
  });

  it('应该正确应用Pauli-Z门', () => {
    const qubit = QubitEncoding.createQubit(1, 1);
    const transformed = QuantumOperators.pauliZ(qubit);
    expect(transformed.alpha).toBeCloseTo(qubit.alpha);
    expect(transformed.beta).toBeCloseTo(-qubit.beta);
  });
});

describe('QuantumOptimization', () => {
  it('应该解决简单的优化问题', () => {
    const problem: OptimizationProblem = {
      objectiveFunction: (x) => x[0] ** 2 + x[1] ** 2,
      dimensions: 2,
      bounds: [[-10, 10], [-10, 10]]
    };

    const result = QuantumOptimization.quantumInspiredOptimization(problem, {
      iterations: 50,
      populationSize: 20
    });

    expect(result.solution).toBeDefined();
    expect(result.solution).toHaveLength(2);
    expect(result.value).toBeLessThan(1);
  });

  it('应该处理带约束的优化问题', () => {
    const problem: OptimizationProblem = {
      objectiveFunction: (x) => x[0] ** 2 + x[1] ** 2,
      dimensions: 2,
      bounds: [[-10, 10], [-10, 10]],
      constraints: (x) => x[0] + x[1] >= 1
    };

    const result = QuantumOptimization.quantumInspiredOptimization(problem, {
      iterations: 50,
      populationSize: 20
    });

    expect(result.solution).toBeDefined();
    if (result.solution) {
      expect(result.solution[0] + result.solution[1]).toBeGreaterThanOrEqual(0.9);
    }
  });
});

describe('QuantumGeneticAlgorithm', () => {
  it('应该优化简单的二次函数', () => {
    const qga = new QuantumGeneticAlgorithm({
      populationSize: 30,
      maxGenerations: 50
    });

    const problem: OptimizationProblem = {
      objectiveFunction: (x) => x[0] ** 2 + x[1] ** 2,
      dimensions: 2,
      bounds: [[-10, 10], [-10, 10]]
    };

    const result = qga.optimize(problem);

    expect(result.solution).toBeDefined();
    expect(result.solution).toHaveLength(2);
    expect(result.value).toBeLessThan(1);
    expect(result.converged).toBeDefined();
  });

  it('应该处理高维优化问题', () => {
    const qga = new QuantumGeneticAlgorithm({
      populationSize: 50,
      maxGenerations: 100
    });

    const dimensions = 10;
    const problem: OptimizationProblem = {
      objectiveFunction: (x) => x.reduce((sum, val) => sum + val ** 2, 0),
      dimensions,
      bounds: Array(dimensions).fill([-10, 10])
    };

    const result = qga.optimize(problem);

    expect(result.solution).toBeDefined();
    expect(result.solution).toHaveLength(dimensions);
    expect(result.value).toBeLessThan(10);
  });
});

describe('QuantumAnnealing', () => {
  it('应该优化简单的二次函数', () => {
    const qa = new QuantumAnnealing({
      maxIterations: 500,
      initialTemperature: 1.0,
      coolingRate: 0.95
    });

    const problem: OptimizationProblem = {
      objectiveFunction: (x) => x[0] ** 2 + x[1] ** 2,
      dimensions: 2,
      bounds: [[-10, 10], [-10, 10]]
    };

    const result = qa.optimize(problem);

    expect(result.solution).toBeDefined();
    expect(result.solution).toHaveLength(2);
    expect(result.value).toBeLessThan(1);
  });

  it('应该处理多峰函数', () => {
    const qa = new QuantumAnnealing({
      maxIterations: 1000,
      initialTemperature: 2.0,
      coolingRate: 0.99
    });

    const problem: OptimizationProblem = {
      objectiveFunction: (x) => Math.sin(x[0]) * Math.cos(x[1]) + 0.1 * (x[0] ** 2 + x[1] ** 2),
      dimensions: 2,
      bounds: [[-5, 5], [-5, 5]]
    };

    const result = qa.optimize(problem);

    expect(result.solution).toBeDefined();
    expect(result.solution).toHaveLength(2);
  });
});

describe('QuantumNeuralNetwork', () => {
  it('应该正确初始化网络', () => {
    const config = {
      layers: [
        { inputSize: 2, outputSize: 4, activation: 'relu' as const, useQuantumGates: false },
        { inputSize: 4, outputSize: 1, activation: 'sigmoid' as const, useQuantumGates: true }
      ],
      learningRate: 0.01,
      batchSize: 32
    };

    const qnn = new QuantumNeuralNetwork(config);

    expect(qnn).toBeDefined();
  });

  it('应该正确执行前向传播', () => {
    const config = {
      layers: [
        { inputSize: 2, outputSize: 4, activation: 'relu' as const, useQuantumGates: false },
        { inputSize: 4, outputSize: 1, activation: 'sigmoid' as const, useQuantumGates: true }
      ],
      learningRate: 0.01,
      batchSize: 32
    };

    const qnn = new QuantumNeuralNetwork(config);
    const input = [0.5, -0.5];
    const output = qnn.forward(input);

    expect(output).toBeDefined();
    expect(output).toHaveLength(1);
    expect(output[0]).toBeGreaterThanOrEqual(0);
    expect(output[0]).toBeLessThanOrEqual(1);
  });

  it('应该正确训练网络', () => {
    const config = {
      layers: [
        { inputSize: 2, outputSize: 4, activation: 'relu' as const, useQuantumGates: false },
        { inputSize: 4, outputSize: 1, activation: 'sigmoid' as const, useQuantumGates: true }
      ],
      learningRate: 0.1,
      batchSize: 4
    };

    const qnn = new QuantumNeuralNetwork(config);

    const trainingData = [
      { input: [0, 0], target: [0] },
      { input: [0, 1], target: [1] },
      { input: [1, 0], target: [1] },
      { input: [1, 1], target: [0] }
    ];

    const history = qnn.train(trainingData, {
      epochs: 10,
      verbose: false
    });

    expect(history).toBeDefined();
    expect(history.length).toBe(10);
  });

  it('应该正确进行预测', () => {
    const config = {
      layers: [
        { inputSize: 2, outputSize: 4, activation: 'relu' as const, useQuantumGates: false },
        { inputSize: 4, outputSize: 1, activation: 'sigmoid' as const, useQuantumGates: true }
      ],
      learningRate: 0.1,
      batchSize: 4
    };

    const qnn = new QuantumNeuralNetwork(config);

    const trainingData = [
      { input: [0, 0], target: [0] },
      { input: [0, 1], target: [1] },
      { input: [1, 0], target: [1] },
      { input: [1, 1], target: [0] }
    ];

    qnn.train(trainingData, { epochs: 50, verbose: false });

    const prediction = qnn.predict([0, 1]);

    expect(prediction).toBeDefined();
    expect(prediction).toHaveLength(1);
    expect(prediction[0]).toBeGreaterThan(0.5);
  });
});

describe('QuantumInspiredAlgorithms', () => {
  it('应该使用QGA算法优化问题', () => {
    const problem: OptimizationProblem = {
      objectiveFunction: (x) => x[0] ** 2 + x[1] ** 2,
      dimensions: 2,
      bounds: [[-10, 10], [-10, 10]]
    };

    const result = QuantumInspiredAlgorithms.optimize(problem, {
      algorithm: 'qga',
      qgaConfig: { populationSize: 20, maxGenerations: 50 }
    });

    expect(result.solution).toBeDefined();
    expect(result.value).toBeLessThan(1);
  });

  it('应该使用QA算法优化问题', () => {
    const problem: OptimizationProblem = {
      objectiveFunction: (x) => x[0] ** 2 + x[1] ** 2,
      dimensions: 2,
      bounds: [[-10, 10], [-10, 10]]
    };

    const result = QuantumInspiredAlgorithms.optimize(problem, {
      algorithm: 'qa',
      qaConfig: { maxIterations: 500 }
    });

    expect(result.solution).toBeDefined();
    expect(result.value).toBeLessThan(1);
  });

  it('应该正确创建量子神经网络', () => {
    const config = {
      layers: [
        { inputSize: 2, outputSize: 4, activation: 'relu' as const, useQuantumGates: false },
        { inputSize: 4, outputSize: 1, activation: 'sigmoid' as const, useQuantumGates: true }
      ],
      learningRate: 0.01,
      batchSize: 32
    };

    const qnn = QuantumInspiredAlgorithms.createQuantumNeuralNetwork(config);

    expect(qnn).toBeDefined();
  });

  it('应该正确编码和解码数据', () => {
    const data = [0.5, -0.5, 0, 1, -1];
    const encoded = QuantumInspiredAlgorithms.encodeData(data);
    const decoded = QuantumInspiredAlgorithms.decodeQubits(encoded);

    expect(decoded).toHaveLength(data.length);
    decoded.forEach((value, index) => {
      expect(value).toBeCloseTo(data[index], 1);
    });
  });

  it('应该正确创建叠加态', () => {
    const superposition = QuantumInspiredAlgorithms.createSuperposition(5);

    expect(superposition).toHaveLength(5);
    superposition.forEach(qubit => {
      const expected = 1 / Math.sqrt(2);
      expect(qubit.alpha).toBeCloseTo(expected);
      expect(qubit.beta).toBeCloseTo(expected);
    });
  });

  it('应该正确纠缠量子比特', () => {
    const qubits = [
      QubitEncoding.createQubit(1, 0),
      QubitEncoding.createQubit(0, 1)
    ];

    const entangled = QuantumInspiredAlgorithms.entangleQubits(qubits);

    expect(entangled).toHaveLength(2);
    entangled.forEach(qubit => {
      const norm = Math.sqrt(qubit.alpha ** 2 + qubit.beta ** 2);
      expect(norm).toBeCloseTo(1);
    });
  });

  it('应该正确测量所有量子比特', () => {
    const qubits = [
      QubitEncoding.createQubit(1, 0),
      QubitEncoding.createQubit(0, 1),
      QubitEncoding.createQubit(1, 1)
    ];

    const measured = QuantumInspiredAlgorithms.measureAll(qubits);

    expect(measured).toHaveLength(3);
    measured.forEach(value => {
      expect([0, 1]).toContain(value);
    });
  });

  it('应该正确应用量子并行性', () => {
    const qubits = [
      QubitEncoding.createQubit(1, 0),
      QubitEncoding.createQubit(0, 1)
    ];

    const result = QuantumInspiredAlgorithms.quantumParallelism(
      qubits,
      QuantumOperators.hadamard
    );

    expect(result).toHaveLength(2);
    result.forEach(qubit => {
      const norm = Math.sqrt(qubit.alpha ** 2 + qubit.beta ** 2);
      expect(norm).toBeCloseTo(1);
    });
  });

  it('应该正确应用量子干涉', () => {
    const qubits = [
      QubitEncoding.createQubit(1, 0),
      QubitEncoding.createQubit(0, 1)
    ];

    const phase = Math.PI / 4;
    const result = QuantumInspiredAlgorithms.quantumInterference(qubits, phase);

    expect(result).toHaveLength(2);
    result.forEach(qubit => {
      const norm = Math.sqrt(qubit.alpha ** 2 + qubit.beta ** 2);
      expect(norm).toBeCloseTo(1);
    });
  });

  it('应该正确进行量子相位估计', () => {
    const qubit = QubitEncoding.createQubit(1, 0);
    const phase = QuantumInspiredAlgorithms.quantumPhaseEstimation(qubit, 10);

    expect(phase).toBeGreaterThanOrEqual(0);
    expect(phase).toBeLessThanOrEqual(1);
  });

  it('应该正确进行量子幅度放大', () => {
    const qubits = [
      QubitEncoding.createQubit(1, 0),
      QubitEncoding.createQubit(0, 1)
    ];

    const amplified = QuantumInspiredAlgorithms.quantumAmplitudeAmplification(qubits, 2);

    expect(amplified).toHaveLength(2);
    amplified.forEach(qubit => {
      const norm = Math.sqrt(qubit.alpha ** 2 + qubit.beta ** 2);
      expect(norm).toBeCloseTo(1);
    });
  });

  it('应该正确进行量子傅里叶变换', () => {
    const qubits = [
      QubitEncoding.createQubit(1, 0),
      QubitEncoding.createQubit(0, 1),
      QubitEncoding.createQubit(1, 1)
    ];

    const transformed = QuantumInspiredAlgorithms.quantumFourierTransform(qubits);

    expect(transformed).toHaveLength(3);
    transformed.forEach(qubit => {
      const norm = Math.sqrt(qubit.alpha ** 2 + qubit.beta ** 2);
      expect(norm).toBeCloseTo(1);
    });
  });

  it('应该正确模拟量子退相干', () => {
    const qubits = [
      QubitEncoding.createQubit(1, 0),
      QubitEncoding.createQubit(0, 1)
    ];

    const decohered = QuantumInspiredAlgorithms.quantumDecoherence(qubits, 0.1);

    expect(decohered).toHaveLength(2);
    decohered.forEach(qubit => {
      const norm = Math.sqrt(qubit.alpha ** 2 + qubit.beta ** 2);
      expect(norm).toBeCloseTo(1);
    });
  });

  it('应该正确模拟量子噪声', () => {
    const qubits = [
      QubitEncoding.createQubit(1, 0),
      QubitEncoding.createQubit(0, 1)
    ];

    const noisy = QuantumInspiredAlgorithms.quantumNoiseModel(qubits, 'combined', 0.1);

    expect(noisy).toHaveLength(2);
    noisy.forEach(qubit => {
      const norm = Math.sqrt(qubit.alpha ** 2 + qubit.beta ** 2);
      expect(norm).toBeCloseTo(1);
    });
  });

  it('应该正确进行性能基准测试', () => {
    const algorithm = () => {
      const qubit = QubitEncoding.createQubit(1, 0);
      const transformed = QuantumOperators.hadamard(qubit);
      QubitEncoding.measure(transformed);
    };

    const benchmark = QuantumInspiredAlgorithms.benchmarkQuantumAlgorithm(algorithm, 50);

    expect(benchmark.averageTime).toBeGreaterThan(0);
    expect(benchmark.minTime).toBeLessThanOrEqual(benchmark.averageTime);
    expect(benchmark.maxTime).toBeGreaterThanOrEqual(benchmark.averageTime);
  });

  it('应该正确比较多个算法', () => {
    const algorithms = [
      {
        name: 'Hadamard',
        algorithm: () => {
          const qubit = QubitEncoding.createQubit(1, 0);
          QuantumOperators.hadamard(qubit);
        }
      },
      {
        name: 'Pauli-X',
        algorithm: () => {
          const qubit = QubitEncoding.createQubit(1, 0);
          QuantumOperators.pauliX(qubit);
        }
      }
    ];

    const results = QuantumInspiredAlgorithms.compareAlgorithms(algorithms, 50);

    expect(results.size).toBe(2);
    results.forEach((benchmark, name) => {
      expect(benchmark.averageTime).toBeGreaterThan(0);
    });
  });
});
