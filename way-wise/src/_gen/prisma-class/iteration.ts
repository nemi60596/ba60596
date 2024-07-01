import { ApiProperty } from "@nestjs/swagger";

import { Benchmark } from "./benchmark";
import { Run } from "./run";

export class Iteration {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  runId: number;

  @ApiProperty({ type: () => Run })
  run: Run;

  @ApiProperty({ isArray: true, type: () => Benchmark })
  benchmarks: Benchmark[];
}
