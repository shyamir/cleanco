import ActivityIcon from "../app/icons/activityIcon";
import HomeIcon from "../app/icons/homeIcon";
import ProfileIcon from "../app/icons/profileIcon";
import type { Href } from "expo-router";

export const Icon = {
  home: (props: { color: string }) => <HomeIcon color={props.color} />,
  activity: (props: { color: string }) => <ActivityIcon color={props.color} />,
  profile: (props: { color: string }) => <ProfileIcon color={props.color} />,
};

export type IconName = keyof typeof Icon;

export const TABS_DATA: {
  label: string;
  icon: IconName;
  route: Href;
}[] = [
  {
    label: "Home",
    icon: "home",
    route: "/home",
  },
  {
    label: "Activity",
    icon: "activity",
    route: "/activity",
  },
  {
    label: "Account",
    icon: "profile",
    route: "/account",
  },
];
