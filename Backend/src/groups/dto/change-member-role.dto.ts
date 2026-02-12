import { IsEnum, IsNotEmpty } from 'class-validator';
import { GroupMemberRole } from '@prisma/client';

export class ChangeMemberRoleDto {
  @IsEnum(GroupMemberRole, { message: 'Role phải là LEADER hoặc MEMBER' })
  @IsNotEmpty({ message: 'Role không được để trống' })
  role: GroupMemberRole;
}
