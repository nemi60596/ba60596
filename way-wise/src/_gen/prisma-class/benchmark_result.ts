import { ApiProperty } from "@nestjs/swagger";

import { Benchmark } from "./benchmark";
import { RouteData } from "./route_data";

export class BenchmarkResult {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  benchmarkId: number;

  @ApiProperty({ type: () => Benchmark })
  benchmark: Benchmark;

  @ApiProperty({ isArray: true, type: () => RouteData })
  RouteDatas: RouteData[];
}
