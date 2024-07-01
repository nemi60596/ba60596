import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { RouteData } from "./route_data";

export class Reference {
  @ApiProperty({ type: Number })
  id: number;

  @ApiPropertyOptional({ type: Number })
  routeDataId?: number;

  @ApiPropertyOptional({ type: () => RouteData })
  routeData?: RouteData;

  @ApiProperty({ type: String })
  loadingState: string;

  @ApiProperty({ type: Boolean })
  unitAvailable: boolean;

  @ApiProperty({ type: String })
  modeOfTransport: string;

  @ApiProperty({ type: Number })
  distanceValue: number;

  @ApiProperty({ type: String })
  distanceUnit: string;

  @ApiProperty({ type: Number })
  tollDistanceValue: number;

  @ApiProperty({ type: String })
  tollDistanceUnit: string;

  @ApiProperty({ type: Number })
  durationValue: number;

  @ApiProperty({ type: String })
  durationUnit: string;

  @ApiProperty({ type: String })
  geometries: string;

  @ApiPropertyOptional({ type: Boolean })
  partOfRoundtrip?: boolean;

  @ApiPropertyOptional({ type: Number })
  co2Value?: number;

  @ApiPropertyOptional({ type: String })
  co2Unit?: string = "kg";
}
