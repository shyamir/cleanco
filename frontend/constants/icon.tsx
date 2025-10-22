import StarIcon from "@/app/icons/starIcon";
import ActivityIcon from "../app/icons/activityIcon";
import HomeIcon from "../app/icons/homeIcon";
import ProfileIcon from "../app/icons/profileIcon";
import LocationIcon from "@/app/icons/locationIcon";
import CalendarIcon from "@/app/icons/calendarIcon";
import NotesIcon from "@/app/icons/notesIcon";

export const Icon = {
  home: (props: { color: string }) => <HomeIcon color={props.color} />,
  activity: (props: { color: string }) => <ActivityIcon color={props.color} />,
  profile: (props: { color: string }) => <ProfileIcon color={props.color} />,
  star: (props: { color: string }) => <StarIcon color={props.color} />,
  location: (props: { color: string }) => <LocationIcon color={props.color} />,
  calendar: (props: { color: string }) => <CalendarIcon color={props.color} />,
  notes: (props: { color: string }) => <NotesIcon color={props.color} />,
};
