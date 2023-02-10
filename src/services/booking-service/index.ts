import enrollmentRepository from "@/repositories/enrollment-repository";
import bookingRepository from "@/repositories/booking-repository";
import ticketRepository from "@/repositories/ticket-repository";
import { notFoundError, roomOverCapacity } from "@/errors";
import { cannotListBookingsError } from "@/errors";

async function insertBookingService(booking: Booking, userId: number) {
    const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
    if (!enrollment) throw notFoundError();
    const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
    if (!ticket || ticket.status === "RESERVED" || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {
        throw cannotListBookingsError();
    }
    const room = await bookingRepository.getRoomCapacity(booking);
    if(!room) throw notFoundError;
    if(room.capacity <= room._count.Booking) {
        throw roomOverCapacity; 
    }
    return await bookingRepository.insertBookingRepository(booking, userId);
}

async function getBookingService(userId: number) {
    const checkBooking = await bookingRepository.getBookingRepository(userId);
    if(checkBooking.length === 0) throw notFoundError;
    return checkBooking;
}

async function changeBookingService(booking: Booking, originId: number, userId: number) {
    const findIfUserHaveReservation = await bookingRepository.getBookingRepository(userId);
    if(findIfUserHaveReservation.length === 0) throw notFoundError;
    const room = await bookingRepository.getRoomCapacity(booking);
    if(!room ) throw notFoundError;
    if(room.capacity < room._count.Booking) {
        throw roomOverCapacity; 
    }
    const changeBooking = await bookingRepository.changeBookingRep(booking, originId);
    if(!changeBooking) throw notFoundError;
    return changeBooking;
}
export type Booking = {
    roomId: number
}
const bookingService = {
    insertBookingService,
    getBookingService,
    changeBookingService
};
export default bookingService;
