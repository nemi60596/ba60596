import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { RouteData } from "./route_data";

export class RoutingEngine {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String })
  name: string;

  @ApiPropertyOptional({ type: () => RouteData })
  routeDataId?: RouteData;

  @ApiProperty({ type: Number })
  distance: number;

  @ApiProperty({ type: String })
  time: string;

  @ApiProperty({ type: Number })
  rtt: number;

  @ApiPropertyOptional({ type: Number })
  elevation?: number;

  @ApiPropertyOptional({ type: String })
  geometry?: string;
}
