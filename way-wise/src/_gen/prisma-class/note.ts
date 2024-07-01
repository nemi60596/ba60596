import { ApiProperty } from "@nestjs/swagger";

import { User } from "./user";

export class Note {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  title: string;

  @ApiProperty({ type: String })
  body: string;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;

  @ApiProperty({ type: () => User })
  user: User;

  @ApiProperty({ type: String })
  userId: string;
}
