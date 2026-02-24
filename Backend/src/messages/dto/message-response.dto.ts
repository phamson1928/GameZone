export class MessageResponseDto {
    id: string;
    groupId: string;
    content: string;
    createdAt: Date;
    sender: {
        id: string;
        username: string;
        avatarUrl: string | null;
    };
}
