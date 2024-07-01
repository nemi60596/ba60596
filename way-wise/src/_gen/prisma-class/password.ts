import { ApiProperty } from "@nestjs/swagger";

import { User } from "./user";

export class Password {
  @ApiProperty({ type: String })
  hash: string;

  @ApiProperty({ type: () => User })
  user: User;

  @ApiProperty({ type: String })
  userId: string;
}
