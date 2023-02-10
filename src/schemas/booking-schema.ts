import Joi from "joi";
import { Booking } from "@/services/booking-service";

export const bookingSchema = Joi.object<Booking>({
    roomId: Joi.number().integer().min(1).required()
});
