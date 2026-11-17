export type MeetingType = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
};

export type MeetingTypeValidationError = {
  code: "INVALID_NAME" | "INVALID_DESCRIPTION" | "INVALID_DURATION";
  message: string;
};

export function createMeetingTypeRepository(meetingTypes: MeetingType[] = []) {
  let nextId = meetingTypes.length + 1;
  return {
    list: () => meetingTypes,
    create: (
      input: unknown,
    ): { meetingType: MeetingType } | { error: MeetingTypeValidationError } => {
      const body = typeof input === "object" && input !== null ? input : {};
      const { name, description, durationMinutes } = body as Record<string, unknown>;
      if (typeof name !== "string" || name.trim() === "") {
        return {
          error: { code: "INVALID_NAME", message: "Введите непустое название типа встречи." },
        };
      }
      if (typeof description !== "string" || description.trim() === "") {
        return {
          error: {
            code: "INVALID_DESCRIPTION",
            message: "Введите непустое описание типа встречи.",
          },
        };
      }
      if (
        typeof durationMinutes !== "number" ||
        !Number.isInteger(durationMinutes) ||
        durationMinutes <= 0
      ) {
        return {
          error: {
            code: "INVALID_DURATION",
            message: "Длительность должна быть положительным целым числом.",
          },
        };
      }

      const meetingType = {
        id: `mt_${nextId++}`,
        name: name.trim(),
        description: description.trim(),
        durationMinutes,
      };
      meetingTypes.push(meetingType);
      return { meetingType };
    },
  };
}
