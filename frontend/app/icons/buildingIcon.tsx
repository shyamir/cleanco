import React from "react";
import Svg, { Path } from "react-native-svg";

interface IconProps {
  width?: number;
  height?: number;
  color?: string;
}

const BuildingIcon: React.FC<IconProps> = ({
  width = 24,
  height = 24,
  color = "#FDFDFD",
}) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
  >
    <Path
      d="M2.25 21H21.75M3.75 3V21M14.25 3V21M20.25 7.5V21M6.75 6.75H7.5M6.75 9.75H7.5M6.75 12.75H7.5M10.5 6.75H11.25M10.5 9.75H11.25M10.5 12.75H11.25M6.75 21V17.625C6.75 17.004 7.254 16.5 7.875 16.5H10.125C10.746 16.5 11.25 17.004 11.25 17.625V21M3 3H15M14.25 7.5H21M17.25 11.25H17.258V11.258H17.25V11.25ZM17.25 14.25H17.258V14.258H17.25V14.25ZM17.25 17.25H17.258V17.258H17.25V17.25Z"
      stroke={color}
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </Svg>
);

export default BuildingIcon;
