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
}
