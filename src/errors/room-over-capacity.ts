import { ApplicationError } from "@/protocols";

export function roomOverCapacity(): ApplicationError {
    return {
        name: "roomOverCapacity",
        message: "This room reached it's full capacity",
    };
}
