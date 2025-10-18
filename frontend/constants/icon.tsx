import ActivityIcon from "../app/icons/activityIcon";
import HomeIcon from "../app/icons/homeIcon";
import ProfileIcon from "../app/icons/profileIcon";

export const Icon = {
  home: (props: { color: string }) => <HomeIcon color={props.color} />,
  activity: (props: { color: string }) => <ActivityIcon color={props.color} />,
  profile: (props: { color: string }) => <ProfileIcon color={props.color} />,
};
