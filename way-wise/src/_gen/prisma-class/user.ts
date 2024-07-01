import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { Note } from "./note";
import { Password } from "./password";

export class User {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  email: string;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => Password })
  password?: Password;

  @ApiProperty({ isArray: true, type: () => Note })
  notes: Note[];
}
