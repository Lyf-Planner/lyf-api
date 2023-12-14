import { User } from "../api/user";
import { initialiseWeek, mapDatesToWeek } from "./utils";

export function handleNewTimetableUser(user: User, local_date: string) {
  // Fill in anything empty - "the bare minimum"
  if (!user.timetable) user.timetable = {};
  if (!user.timetable?.upcoming) user.timetable.upcoming = [];
  if (!user.timetable?.todo) user.timetable.todo = [];
  if (!user?.timetable?.weeks || user?.timetable?.weeks.length === 0) {
    user.timetable.weeks = [{}];
    initialiseWeek(user.timetable.weeks[0]);
    mapDatesToWeek(user.timetable.weeks[0], local_date);
  }
  if (!user?.timetable?.templates || user?.timetable?.templates.length === 0) {
    user.timetable.templates = [{}];
    initialiseWeek(user.timetable.templates[0]);
  }

  console.log(
    "Built timetable",
    user.timetable.weeks[0]?.Monday?.date,
    "for new timetable user",
    user.user_id
  );
}
