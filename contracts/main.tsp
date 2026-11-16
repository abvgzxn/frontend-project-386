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

@route("/api")
interface Health {
  @get
  @route("/health")
  health(): HealthResponse;
}
