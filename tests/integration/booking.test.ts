import supertest from "supertest";
import app, { init } from "@/app";
import faker from "@faker-js/faker";
import { cleanDb, generateValidToken } from "../helpers";
import httpStatus from "http-status";
import { TicketStatus } from "@prisma/client";
import {
    createEnrollmentWithAddress,
    createUser,
    createSession,
    createTicket,
    createPayment,
    createTicketTypeWithHotel,
    createTicketTypeRemote,
    createHotel,
    createRoomWithHotelId,
    createBooking,
    createSingleBooking
} from "../factories";

beforeAll(async () => {
    await init();
});

beforeEach(async () => {
    await cleanDb();
});

const server = supertest(app);

describe("POST /booking", () => {
    it("No token in Headers, response -> 401", async () => {
        const response = await server.post("/booking");
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("Invalid Token Passed, response -> 401", async () => {
        const token = faker.random.alphaNumeric();
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("Valid token, but no enrollment, response -> 404", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const obj= { roomId: 1 };
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(obj);
        expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    describe( "Valid token", () => {
        it( "Remote ticket, response -> 402", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeRemote();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            await createPayment(ticket.id, ticketType.price);
            const obj= { roomId: 1 };
            const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(obj);
            expect(response.statusCode).toEqual(httpStatus.PAYMENT_REQUIRED);
        });

        it("Wrong info in the body", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const payment = await createPayment(ticket.id, ticketType.price);
            const createdHotel = await createHotel();
            const createdRoom = await createRoomWithHotelId(createdHotel.id);
            const obj = { id: createdRoom.id };

            const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(obj);
            expect(response.status).toBe(httpStatus.BAD_REQUEST);
        });

        it("Wrong roomId in the body", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            await createPayment(ticket.id, ticketType.price);
            const createdHotel = await createHotel();
            await createRoomWithHotelId(createdHotel.id);

            const obj = { roomId: 0 };
            const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(obj);

            expect(response.status).toBe(httpStatus.BAD_REQUEST);
        });

        it("Successful post creation", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            await createSession(token);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            await createPayment(ticket.id, ticketType.price);
            const createdHotel = await createHotel();
            const room = await createRoomWithHotelId(createdHotel.id);

            const obj = { roomId: room.id }; 
            const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(obj);

            expect(response.statusCode).toBe(httpStatus.CREATED);
        });

        it("Booking in a room over capacity", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            await createPayment(ticket.id, ticketType.price);
            const createdHotel = await createHotel();
            const room = await createRoomWithHotelId(createdHotel.id);
            await createBooking(room.id);
            const obj = { roomId: room.id }; 
            const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(obj);
            expect(response.status).toBe(httpStatus.FORBIDDEN);
        });
    });
});

describe("GET /booking route", () => {
    it("No token in Headers, response -> 401", async () => {
        const response = await server.get("/booking");
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("Invalid Token Passed, response -> 401", async () => {
        const token = faker.random.alphaNumeric();
        const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    describe("Valid token passed", () => {
        it("User doens't have a booking yet", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            await createPayment(ticket.id, ticketType.price);
            const createdHotel = await createHotel();
            await createRoomWithHotelId(createdHotel.id);
            
            const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
            expect(response.status).toBe(httpStatus.NOT_FOUND);
        });

        it("User have a reservation, -> response 200", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            await createPayment(ticket.id, ticketType.price);
            const createdHotel = await createHotel();
            const room = await createRoomWithHotelId(createdHotel.id);
            await createSingleBooking(room.id, user.id);

            const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
            expect(response.status).toBe(200);
            expect(response.body).toEqual(
                expect.objectContaining({
                    id: expect.any(Number),
                    Room: expect.objectContaining({
                        id: expect.any(Number),
                        name: expect.any(String),
                        capacity: expect.any(Number),
                        hotelId: expect.any(Number),
                        createdAt: expect.any(String),
                        updatedAt: expect.any(String),
                    })
                })
            );
        });
    });
});

describe("PUT /booking/id route", () => {
    it("No token in Headers, response -> 401", async () => {
        const response = await server.put("/booking/1");
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    it("Invalid Token Passed, response -> 401", async () => {
        const token = faker.random.alphaNumeric();
        const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    it("Wrong body passed", async () => {
        const token = await generateValidToken();
        const obj = { id: 1 };
        const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send(obj);
        expect(response.status).toBe(httpStatus.BAD_REQUEST);
    });
    it("User doesn't have booking", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
        const createdHotel = await createHotel();
        const room = await createRoomWithHotelId(createdHotel.id);

        const obj = { roomId: 1 };
        const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send(obj);
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    it("Room over capacity", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
        const createdHotel = await createHotel();
        const room = await createRoomWithHotelId(createdHotel.id);
        await createBooking(room.id);
        const booking = await createSingleBooking(room.id, user.id);

        const obj = { roomId: room.id };
        const response = await server.put(`/booking/${booking}`).set("Authorization", `Bearer ${token}`).send(obj);
        expect(response.status).toBe(httpStatus.FORBIDDEN);
    });
    it("Successful PUT, response -> 200", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
        const createdHotel = await createHotel();
        const room1 = await createRoomWithHotelId(createdHotel.id);
        const room2 = await createRoomWithHotelId(createdHotel.id);
        const booking = await createSingleBooking(room1.id, user.id);

        const obj = { roomId: room2.id };
        const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send(obj);
        expect(response.status).toBe(httpStatus.OK);
    });
});
