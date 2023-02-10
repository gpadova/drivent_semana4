import bookingService from "@/services/booking-service";
import { Response } from "express";
import { AuthenticatedRequest } from "@/middlewares";
import httpStatus from "http-status";
import { Booking } from "@/services/booking-service";

export async function postBooking(req: AuthenticatedRequest, res: Response) {
    const booking = req.body as Booking;
    const { userId } = req; 
    const numberedUserId = Number(userId);
    try {
        const book = await bookingService.insertBookingService(booking, numberedUserId);
        return res.status(httpStatus.CREATED).send(book);        
    } catch (error) {
        if(error.name === "NotFoundError") { 
            return res.sendStatus(httpStatus.NOT_FOUND);
        }
        if(error.name === "CannotListHotelsBookings") return res.sendStatus(httpStatus.PAYMENT_REQUIRED);
        if(error.name === "roomOverCapacity") return res.sendStatus(httpStatus.FORBIDDEN);
        return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
}

export async function getBooking(req: AuthenticatedRequest, res: Response) {
    const { userId } = req;
    try {
        const booking = await bookingService.getBookingService(userId);
        const response = {
            id: booking[0].id,
            Room: booking[0].Room
        };
        return res.status(200).send(response);
    } catch (error) {
        if(error.name === "notFoundError")return res.sendStatus(httpStatus.NOT_FOUND);
        return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
}
export async function changeBooking(req: AuthenticatedRequest, res: Response) {
    const booking = req.body as Booking;
    const { bookingId } = req.params;
    const numberedBookingId = Number(bookingId);
    const { userId } = req;
    try {
        const newBooking = await bookingService.changeBookingService(booking, numberedBookingId, userId );
        return res.status(httpStatus.OK).send(newBooking);
    } catch (error) {
        if(error.name === "roomOverCapacity") return res.sendStatus(httpStatus.FORBIDDEN);
        return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
}
