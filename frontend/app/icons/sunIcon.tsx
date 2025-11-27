import React from "react";
import Svg, { Path } from "react-native-svg";

interface IconProps {
  width?: number;
  height?: number;
  color?: string;
}

const SunIcon: React.FC<IconProps> = ({
  width = 24,
  height = 24,
  color = "#FDFDFD",
}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5V3M12 21V19M16.95 7.05L18.364 5.636M5.636 18.364L7.05 16.95M19 12H21M3 12H5M16.95 16.95L18.364 18.364M5.636 5.636L7.05 7.05M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z"
      stroke={color}
      stroke-linecap="round"
    />
  </Svg>
);

export default SunIcon;
