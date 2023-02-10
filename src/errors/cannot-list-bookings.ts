import { ApplicationError } from "@/protocols";

export function cannotListBookingsError(): ApplicationError {
    return {
        name: "CannotListHotelsBookings",
        message: "Cannot list Bookings!",
    };
}
