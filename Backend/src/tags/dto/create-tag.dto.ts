import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên tag không được để trống' })
  @MaxLength(50, { message: 'Tên tag không được quá 50 ký tự' })
  name: string;
}
