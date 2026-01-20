/**
 * @file QuantumOptimization.ts
 * @description 量子优化 - 实现量子优化算法
 * @module core/quantum-inspired/utils
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-06
 */

import { QubitState } from './QubitEncoding';
import { QuantumOperators } from './QuantumOperators';

export interface OptimizationProblem {
  objectiveFunction: (solution: number[]) => number;
  dimensions: number;
  bounds: [number, number][];
  constraints?: (solution: number[]) => boolean;
}

export interface OptimizationResult {
  solution: number[];
  value: number;
  iterations: number;
  converged: boolean;
}

export class QuantumOptimization {
  private static readonly DEFAULT_ITERATIONS = 1000;
  private static readonly DEFAULT_POPULATION_SIZE = 50;
  private static readonly DEFAULT_TEMPERATURE = 1.0;
  private static readonly DEFAULT_COOLING_RATE = 0.95;

  static quantumInspiredOptimization(
    problem: OptimizationProblem,
    options: {
      iterations?: number;
      populationSize?: number;
      temperature?: number;
      coolingRate?: number;
    } = {}
  ): OptimizationResult {
    const iterations = options.iterations || this.DEFAULT_ITERATIONS;
    const populationSize = options.populationSize || this.DEFAULT_POPULATION_SIZE;
    const temperature = options.temperature || this.DEFAULT_TEMPERATURE;
    const coolingRate = options.coolingRate || this.DEFAULT_COOLING_RATE;

    let population = this.initializePopulation(problem, populationSize);
    let bestSolution = this.findBest(population, problem);
    let currentTemperature = temperature;
    let converged = false;

    for (let i = 0; i < iterations; i++) {
      const newPopulation = this.evolvePopulation(population, problem, currentTemperature);
      const newBest = this.findBest(newPopulation, problem);

      if (newBest.value < bestSolution.value) {
        bestSolution = newBest;
      }

      population = newPopulation;
      currentTemperature *= coolingRate;

      if (this.hasConverged(population, problem, 1e-6)) {
        converged = true;
        break;
      }
    }

    return {
      solution: bestSolution.solution,
      value: bestSolution.value,
      iterations: iterations,
      converged
    };
  }

  private static initializePopulation(
    problem: OptimizationProblem,
    size: number
  ): number[][] {
    const population: number[][] = [];
    for (let i = 0; i < size; i++) {
      const solution: number[] = [];
      for (let j = 0; j < problem.dimensions; j++) {
        const [min, max] = problem.bounds[j];
        solution.push(min + Math.random() * (max - min));
      }
      population.push(solution);
    }
    return population;
  }

  private static evolvePopulation(
    population: number[][],
    problem: OptimizationProblem,
    temperature: number
  ): number[][] {
    const newPopulation: number[][] = [];

    for (let i = 0; i < population.length; i++) {
      const parent1 = this.selectParent(population, problem, temperature);
      const parent2 = this.selectParent(population, problem, temperature);
      const child = this.crossover(parent1, parent2);
      const mutated = this.mutate(child, problem, temperature);

      if (!problem.constraints || problem.constraints(mutated)) {
        newPopulation.push(mutated);
      } else {
        newPopulation.push(parent1);
      }
    }

    return newPopulation;
  }

  private static selectParent(
    population: number[][],
    problem: OptimizationProblem,
    temperature: number
  ): number[] {
    const tournamentSize = 3;
    let best = population[Math.floor(Math.random() * population.length)];
    let bestValue = problem.objectiveFunction(best);

    for (let i = 1; i < tournamentSize; i++) {
      const candidate = population[Math.floor(Math.random() * population.length)];
      const candidateValue = problem.objectiveFunction(candidate);

      if (candidateValue < bestValue || Math.random() < temperature) {
        best = candidate;
        bestValue = candidateValue;
      }
    }

    return best;
  }

  private static crossover(parent1: number[], parent2: number[]): number[] {
    const crossoverPoint = Math.floor(Math.random() * parent1.length);
    const child: number[] = [];

    for (let i = 0; i < parent1.length; i++) {
      if (i < crossoverPoint) {
        child.push(parent1[i]);
      } else {
        child.push(parent2[i]);
      }
    }

    return child;
  }

  private static mutate(
    solution: number[],
    problem: OptimizationProblem,
    temperature: number
  ): number[] {
    const mutated = [...solution];
    const mutationRate = temperature * 0.1;

    for (let i = 0; i < mutated.length; i++) {
      if (Math.random() < mutationRate) {
        const [min, max] = problem.bounds[i];
        const mutation = (Math.random() - 0.5) * temperature * (max - min);
        mutated[i] = Math.max(min, Math.min(max, mutated[i] + mutation));
      }
    }

    return mutated;
  }

  private static findBest(
    population: number[][],
    problem: OptimizationProblem
  ): { solution: number[]; value: number } {
    let best = population[0];
    let bestValue = problem.objectiveFunction(best);

    for (let i = 1; i < population.length; i++) {
      const value = problem.objectiveFunction(population[i]);
      if (value < bestValue) {
        best = population[i];
        bestValue = value;
      }
    }

    return { solution: best, value: bestValue };
  }

  private static hasConverged(
    population: number[][],
    problem: OptimizationProblem,
    threshold: number
  ): boolean {
    const values = population.map(solution => problem.objectiveFunction(solution));
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;

    return variance < threshold;
  }

  static quantumAnnealing(
    problem: OptimizationProblem,
    options: {
      iterations?: number;
      initialTemperature?: number;
      coolingRate?: number;
    } = {}
  ): OptimizationResult {
    const iterations = options.iterations || this.DEFAULT_ITERATIONS;
    const initialTemperature = options.initialTemperature || this.DEFAULT_TEMPERATURE;
    const coolingRate = options.coolingRate || this.DEFAULT_COOLING_RATE;

    let currentSolution = this.initializePopulation(problem, 1)[0];
    let currentValue = problem.objectiveFunction(currentSolution);
    let bestSolution = [...currentSolution];
    let bestValue = currentValue;
    let temperature = initialTemperature;
    let converged = false;

    for (let i = 0; i < iterations; i++) {
      const newSolution = this.mutate(currentSolution, problem, temperature);
      const newValue = problem.objectiveFunction(newSolution);

      if (newValue < currentValue || Math.random() < Math.exp(-(newValue - currentValue) / temperature)) {
        currentSolution = newSolution;
        currentValue = newValue;

        if (newValue < bestValue) {
          bestSolution = [...newSolution];
          bestValue = newValue;
        }
      }

      temperature *= coolingRate;

      if (temperature < 1e-10) {
        converged = true;
        break;
      }
    }

    return {
      solution: bestSolution,
      value: bestValue,
      iterations: iterations,
      converged
    };
  }

  static parallelTempering(
    problem: OptimizationProblem,
    options: {
      iterations?: number;
      numTemperatures?: number;
      temperatureRange?: [number, number];
    } = {}
  ): OptimizationResult {
    const iterations = options.iterations || this.DEFAULT_ITERATIONS;
    const numTemperatures = options.numTemperatures || 5;
    const [minTemp, maxTemp] = options.temperatureRange || [0.1, 10.0];

    const temperatures: number[] = [];
    for (let i = 0; i < numTemperatures; i++) {
      temperatures.push(minTemp + (maxTemp - minTemp) * i / (numTemperatures - 1));
    }

    const populations = temperatures.map(temp => this.initializePopulation(problem, 10));
    const bestValues = populations.map(pop => this.findBest(pop, problem).value);

    for (let i = 0; i < iterations; i++) {
      for (let j = 0; j < numTemperatures; j++) {
        populations[j] = this.evolvePopulation(populations[j], problem, temperatures[j]);
        const newBest = this.findBest(populations[j], problem);
        if (newBest.value < bestValues[j]) {
          bestValues[j] = newBest.value;
        }
      }

      for (let j = 0; j < numTemperatures - 1; j++) {
        if (Math.random() < 0.5) {
          const temp = populations[j][0];
          populations[j][0] = populations[j + 1][0];
          populations[j + 1][0] = temp;
        }
      }
    }

    const globalBest = this.findBest(populations.flat(), problem);
    return {
      solution: globalBest.solution,
      value: globalBest.value,
      iterations: iterations,
      converged: true
    };
  }
}