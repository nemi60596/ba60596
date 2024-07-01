import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { BenchmarkResult } from "./benchmark_result";
import { Reference } from "./reference";
import { RoutingEngine } from "./routing_engine";


export class RouteData {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  startLat: number;

  @ApiProperty({ type: Number })
  startLon: number;

  @ApiProperty({ type: Number })
  destinationLat: number;

  @ApiProperty({ type: Number })
  destinationLon: number;

  @ApiProperty({ type: String })
  mode: string;

  @ApiPropertyOptional({ type: String })
  description?: string;

  @ApiPropertyOptional({ type: String })
  distanceClass?: string;

  @ApiPropertyOptional({ type: String })
  regionClass?: string;

  @ApiPropertyOptional({ type: String })
  requestOptions?: string;

  @ApiPropertyOptional({ type: Number })
  routingEngineId?: number;

  @ApiPropertyOptional({ type: () => RoutingEngine })
  routingEngine?: RoutingEngine;

  @ApiPropertyOptional({ type: () => BenchmarkResult })
  BenchmarkResult?: BenchmarkResult;

  @ApiPropertyOptional({ type: Number })
  benchmarkResultId?: number;

  @ApiPropertyOptional({ type: () => Reference })
  Reference?: Reference;
}
