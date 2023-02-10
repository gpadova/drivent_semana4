import { prisma } from "@/config";

async function insertBookingRepository(booking: Booking, userId: number) {
    return prisma.booking.create({
        data: {
            roomId: booking.roomId,
            userId
        }
    });
}

async function getRoomCapacity(booking: Booking) {
    return prisma.room.findUnique({
        where: {
            id: booking.roomId
        },
        include: {
            _count: {
                select: {
                    Booking: true
                }
            }
        }
    });
}

async function getBookingRepository(userId: number) {
    return prisma.booking.findMany({
        where: {
            userId
        },
        include: {
            Room: true
        }
    });
}

async function changeBookingRep(booking: Booking, originId: number) {
    return prisma.booking.updateMany({
        where: {
            roomId: originId
        },
        data: {
            roomId: booking.roomId
        }
    });
}

type Booking = {
    roomId: number
}

const bookingRepository = {
    insertBookingRepository,
    getRoomCapacity,
    getBookingRepository,
    changeBookingRep
};

export default bookingRepository;
