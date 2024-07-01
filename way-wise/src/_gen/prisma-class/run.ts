import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { Iteration } from "./iteration";

export class Run {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;

  @ApiPropertyOptional({ type: String })
  notes?: string;

  @ApiProperty({ type: Number })
  iterationCount: number;

  @ApiProperty({ isArray: true, type: () => Iteration })
  iterations: Iteration[];
}
