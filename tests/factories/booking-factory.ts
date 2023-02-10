import { prisma } from "@/config";
import { createUser } from "./users-factory";

export async function createBooking(roomId: number) {
    const user1 = await createUser();
    const user2 = await createUser();
    const user3 = await createUser();
    return prisma.booking.createMany({
        data: [{ roomId, userId: user1.id },
            { roomId, userId: user2.id },
            { roomId, userId: user3.id }]
    });
}

export async function createSingleBooking(roomId: number, userId: number) {
    return prisma.booking.create({
        data: { roomId, userId }
    });
}
