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
}
