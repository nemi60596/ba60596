import { ApiProperty } from "@nestjs/swagger";

import { BenchmarkResult } from "./benchmark_result";
import { Iteration } from "./iteration";

export class Benchmark {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: () => Iteration })
  iteration: Iteration;

  @ApiProperty({ type: Number })
  iterationId: number;

  @ApiProperty({ isArray: true, type: () => BenchmarkResult })
  results: BenchmarkResult[];
}
