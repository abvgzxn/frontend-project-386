import "@typespec/http";
import "@typespec/openapi3";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

@service(#{ title: "Календарь звонков API" })
@server("http://localhost:3000", "Локальный API")
namespace CallCalendar;

model HealthResponse {
  status: "ok";
}

model MeetingType {
  id: string;
  name: string;
  description: string;
  durationMinutes: int32;
}

model MeetingTypesResponse {
  meetingTypes: MeetingType[];
}

model CreateMeetingTypeRequest {
  name: string;
  description: string;
  durationMinutes: int32;
}

model MeetingTypeResponse {
  meetingType: MeetingType;
}

model AvailabilitySlot {
  startsAt: string;
  endsAt: string;
}

model MeetingTypeAvailabilityResponse {
  meetingTypeId: string;
  from: string;
  to: string;
  slots: AvailabilitySlot[];
}

model Booking {
  id: string;
  meetingTypeId: string;
  guestName: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
}

model CreateBookingRequest {
  meetingTypeId: string;
  startsAt: string;
  guestName: string;
}

model BookingResponse {
  booking: Booking;
}

model BookingsResponse {
  bookings: Booking[];
}

model ErrorResponse {
  code: string;
  message: string;
}

@route("/api")
interface Health {
  @get
  @route("/health")
  health(): HealthResponse;
}

@route("/api")
interface MeetingTypes {
  @get
  @route("/meeting-types")
  list(): MeetingTypesResponse;

  @post
  @route("/meeting-types")
  create(@body body: CreateMeetingTypeRequest): {
    @statusCode statusCode: 201;
    @body body: MeetingTypeResponse;
  } | {
    @statusCode statusCode: 400;
    @body body: ErrorResponse;
  };

  @get
  @route("/meeting-types/{id}/availability")
  availability(
    @path id: string,
    @query from: string,
    @query to: string,
  ): MeetingTypeAvailabilityResponse | {
    @statusCode statusCode: 400;
    @body body: ErrorResponse;
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  };
}

@route("/api")
interface Bookings {
  @post
  @route("/bookings")
  create(@body body: CreateBookingRequest): {
    @statusCode statusCode: 201;
    @body body: BookingResponse;
  } | {
    @statusCode statusCode: 400;
    @body body: ErrorResponse;
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  } | {
    @statusCode statusCode: 409;
    @body body: ErrorResponse;
  };

  @get
  @route("/bookings/upcoming")
  upcoming(): BookingsResponse;
}
