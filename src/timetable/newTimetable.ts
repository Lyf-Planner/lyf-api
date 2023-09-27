import { User } from "../types";
import { initialiseWeek, mapDatesToWeek } from "./utils";

export function handleNewTimetableUser(user: User) {
  // Fill in anything empty - "the bare minimum"
  if (!user.timetable) user.timetable = {};
  if (!user.timetable?.upcoming) user.timetable.upcoming = [];
  if (!user?.timetable?.weeks || user?.timetable?.weeks.length === 0) {
    user.timetable.weeks = [{}];
    initialiseWeek(user.timetable.weeks[0]);
    mapDatesToWeek(user.timetable.weeks[0]);
  }
  if (!user?.timetable?.templates || user?.timetable?.templates.length === 0) {
    user.timetable.templates = [{}];
    initialiseWeek(user.timetable.templates[0]);
  }

  
}
