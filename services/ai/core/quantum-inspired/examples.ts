import {
  QuantumInspiredAlgorithms,
  QuantumGeneticAlgorithm,
  QuantumAnnealing,
  QuantumNeuralNetwork
} from './index';

function example1QuantumGeneticAlgorithm() {
  console.log('示例1: 量子遗传算法优化');

  const problem = {
    objectiveFunction: (x: number[]) => {
      return x[0] ** 2 + x[1] ** 2;
    },
    dimensions: 2,
    bounds: [[-10, 10], [-10, 10]] as [number, number][]
  };

  const result = QuantumInspiredAlgorithms.optimize(problem, {
    algorithm: 'qga',
    qgaConfig: {
      populationSize: 50,
      maxGenerations: 100,
      crossoverRate: 0.8,
      mutationRate: 0.1
    }
  });

  console.log('最优解:', result.solution);
  console.log('最优值:', result.value);
  console.log('收敛:', result.converged);
  console.log('迭代次数:', result.iterations);
}

function example2QuantumAnnealing() {
  console.log('\n示例2: 量子退火优化');

  const problem = {
    objectiveFunction: (x: number[]) => {
      return Math.sin(x[0]) * Math.cos(x[1]) + 0.1 * (x[0] ** 2 + x[1] ** 2);
    },
    dimensions: 2,
    bounds: [[-5, 5], [-5, 5]] as [number, number][]
  };

  const result = QuantumInspiredAlgorithms.optimize(problem, {
    algorithm: 'qa',
    qaConfig: {
      maxIterations: 1000,
      initialTemperature: 2.0,
      coolingRate: 0.99,
      tunnelingRate: 0.1
    }
  });

  console.log('最优解:', result.solution);
  console.log('最优值:', result.value);
}

function example3QuantumNeuralNetwork() {
  console.log('\n示例3: 量子神经网络');

  const config = {
    layers: [
      {
        inputSize: 2,
        outputSize: 4,
        activation: 'relu' as const,
        useQuantumGates: false
      },
      {
        inputSize: 4,
        outputSize: 4,
        activation: 'relu' as const,
        useQuantumGates: true
      },
      {
        inputSize: 4,
        outputSize: 1,
        activation: 'sigmoid' as const,
        useQuantumGates: true
      }
    ],
    learningRate: 0.1,
    epochs: 100,
    batchSize: 4
  };

  const qnn = QuantumInspiredAlgorithms.createQuantumNeuralNetwork(config);

  const trainingInputs = [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1]
  ];

  const trainingTargets = [
    [0],
    [1],
    [1],
    [0]
  ];

  console.log('训练量子神经网络...');
  const history = qnn.train(trainingInputs, trainingTargets, {
    verbose: true
  });

  console.log('\n测试预测:');
  const testCases = [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1]
  ];

  testCases.forEach(testCase => {
    const prediction = qnn.predict(testCase);
    console.log(`输入: ${testCase}, 预测: ${prediction[0].toFixed(4)}`);
  });
}

function example4QuantumOperations() {
  console.log('\n示例4: 量子操作');

  const data = [0.5, -0.5, 0, 1, -1];
  console.log('原始数据:', data);

  const encoded = QuantumInspiredAlgorithms.encodeData(data);
  console.log('编码后的量子比特数:', encoded.length);

  const superposition = QuantumInspiredAlgorithms.createSuperposition(5);
  console.log('创建叠加态:', superposition.length, '个量子比特');

  const entangled = QuantumInspiredAlgorithms.entangleQubits(encoded);
  console.log('纠缠后的量子比特数:', entangled.length);

  const measured = QuantumInspiredAlgorithms.measureAll(entangled);
  console.log('测量结果:', measured);

  const decoded = QuantumInspiredAlgorithms.decodeQubits(encoded);
  console.log('解码后的数据:', decoded);
}

function example5PerformanceBenchmark() {
  console.log('\n示例5: 性能基准测试');

  const algorithms = [
    {
      name: 'Hadamard门',
      algorithm: () => {
        const qubit = QuantumInspiredAlgorithms.createQubit(1, 0);
        QuantumInspiredAlgorithms.applyQuantumGate(qubit, (q) => {
          const sqrt2 = Math.sqrt(2);
          return {
            alpha: (q.alpha + q.beta) / sqrt2,
            beta: (q.alpha - q.beta) / sqrt2
          };
        });
      }
    },
    {
      name: 'Pauli-X门',
      algorithm: () => {
        const qubit = QuantumInspiredAlgorithms.createQubit(1, 0);
        QuantumInspiredAlgorithms.applyQuantumGate(qubit, (q) => ({
          alpha: q.beta,
          beta: q.alpha
        }));
      }
    }
  ];

  const results = QuantumInspiredAlgorithms.compareAlgorithms(algorithms, 100);

  console.log('性能比较结果:');
  results.forEach((benchmark, name) => {
    console.log(`${name}:`);
    console.log(`  平均时间: ${benchmark.averageTime.toFixed(6)}ms`);
    console.log(`  最小时间: ${benchmark.minTime.toFixed(6)}ms`);
    console.log(`  最大时间: ${benchmark.maxTime.toFixed(6)}ms`);
  });
}

function example6QuantumNoise() {
  console.log('\n示例6: 量子噪声模拟');

  const qubits = QuantumInspiredAlgorithms.createSuperposition(5);
  console.log('原始量子比特数:', qubits.length);

  const decohered = QuantumInspiredAlgorithms.quantumDecoherence(qubits, 0.2);
  console.log('退相干后的量子比特数:', decohered.length);

  const noisy = QuantumInspiredAlgorithms.quantumNoiseModel(qubits, 'combined', 0.15);
  console.log('添加噪声后的量子比特数:', noisy.length);
}

async function runAllExamples() {
  try {
    example1QuantumGeneticAlgorithm();
    example2QuantumAnnealing();
    example3QuantumNeuralNetwork();
    example4QuantumOperations();
    example5PerformanceBenchmark();
    example6QuantumNoise();

    console.log('\n所有示例运行完成! 🌹');
  } catch (error) {
    console.error('运行示例时出错:', error);
  }
}

if (require.main === module) {
  runAllExamples();
}

export {
  example1QuantumGeneticAlgorithm,
  example2QuantumAnnealing,
  example3QuantumNeuralNetwork,
  example4QuantumOperations,
  example5PerformanceBenchmark,
  example6QuantumNoise,
  runAllExamples
};
