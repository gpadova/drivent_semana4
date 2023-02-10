import { postBooking, getBooking, changeBooking } from "@/controllers/booking-controller";
import { Router } from "express";
import { authenticateToken } from "@/middlewares";
import { bookingSchema } from "@/schemas";
import { validateBody } from "@/middlewares";

const bookingRouter = Router();

bookingRouter
    .all("/*", authenticateToken)
    .get("", getBooking)
    .post("", validateBody(bookingSchema), postBooking)
    .put("/:bookingId", validateBody(bookingSchema), changeBooking);

export { bookingRouter }; 
