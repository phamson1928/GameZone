export class MessageResponseDto {
    id: string;
    groupId: string;
    content: string;
    isDeleted: boolean;
    createdAt: Date;
    sender: {
        id: string;
        username: string;
        avatarUrl: string | null;
    };
}