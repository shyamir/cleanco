import React from "react";
import Svg, { Path } from "react-native-svg";

interface IconProps {
  width?: number;
  height?: number;
  color?: string;
}

const HotelIcon: React.FC<IconProps> = ({
  width = 24,
  height = 24,
  color = "#FDFDFD",
}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2 6V18M22 14.5V18M22 14.5H2M22 14.5H11V8H20.5C20.8978 8 21.2794 8.15804 21.5607 8.43934C21.842 8.72064 22 9.10218 22 9.5V14.5Z"
      stroke={color}
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <Path
      d="M7 13C8.10457 13 9 12.1046 9 11C9 9.89543 8.10457 9 7 9C5.89543 9 5 9.89543 5 11C5 12.1046 5.89543 13 7 13Z"
      stroke={color}
    />
  </Svg>
);

export default HotelIcon;
