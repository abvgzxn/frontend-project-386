export type MeetingType = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
};

export function createMeetingTypeRepository(meetingTypes: MeetingType[] = []) {
  return {
    list: () => meetingTypes,
  };
}
