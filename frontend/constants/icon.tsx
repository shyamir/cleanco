import StarIcon from "@/app/icons/starIcon";
import ActivityIcon from "../app/icons/activityIcon";
import HomeIcon from "../app/icons/homeIcon";
import ProfileIcon from "../app/icons/profileIcon";
import LocationIcon from "@/app/icons/locationIcon";
import CalendarIcon from "@/app/icons/calendarIcon";
import NotesIcon from "@/app/icons/notesIcon";
import SparkleIcon from "@/app/icons/sparkleIcon";
import StarFilledIcon from "@/app/icons/starFilledIcon";
import MinusIcon from "@/app/icons/minusIcon";
import AddIcon from "@/app/icons/addIcon";
import PinIcon from "@/app/icons/pinIcon";
import BackIcon from "@/app/icons/backIcon";
import SearchIcon from "@/app/icons/searchIcon";
import CloseIcon from "@/app/icons/closeIcon";
import CheckIcon from "@/app/icons/checkIcon";
import BriefcaseIcon from "@/app/icons/briefcaseIcon";
import ArrowDownIcon from "@/app/icons/arrowDownIcon";
import BuildingIcon from "@/app/icons/buildingIcon";
import HotelIcon from "@/app/icons/hotelIcon";


export const Icon = {
  home: (props: { color: string }) => <HomeIcon color={props.color} />,
  activity: (props: { color: string }) => <ActivityIcon color={props.color} />,
  profile: (props: { color: string }) => <ProfileIcon color={props.color} />,
  sparkle: (props: { color: string }) => <SparkleIcon color={props.color} />,
  location: (props: { color: string }) => <LocationIcon color={props.color} />,
  calendar: (props: { color: string }) => <CalendarIcon color={props.color} />,
  notes: (props: { color: string }) => <NotesIcon color={props.color} />,
  star: (props: { color: string }) => <StarIcon color={props.color} />,
  starFilled: (props: { color: string }) => (
    <StarFilledIcon color={props.color} />
  ),
  minus: (props: { color: string }) => <MinusIcon color={props.color} />,
  add: (props: { color: string }) => <AddIcon color={props.color} />,
  pin: (props: { color: string }) => <PinIcon color={props.color} />,
  back: (props: { color: string }) => <BackIcon color={props.color} />,
  search: (props: { color: string }) => <SearchIcon color={props.color} />,
  close: (props: { color: string }) => <CloseIcon color={props.color} />,
  check: (props: { color: string }) => <CheckIcon color={props.color} />,
  building: (props: { color: string }) => <BuildingIcon color={props.color} />,
  hotel: (props: { color: string }) => <HotelIcon color={props.color} />,
  briefcase: (props: { color: string }) => (
    <BriefcaseIcon color={props.color} />
  ),
  arrrowDown: (props: { color: string }) => (
    <ArrowDownIcon color={props.color} />
  ),
};
