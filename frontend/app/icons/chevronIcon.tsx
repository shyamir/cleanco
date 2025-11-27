import React from "react";
import Svg, { Path } from "react-native-svg";

interface IconProps {
  width?: number;
  height?: number;
  color?: string;
}

const ChevronIcon: React.FC<IconProps> = ({
  width = 24,
  height = 24,
  color = "#FDFDFD",
}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9.5 17.5L14.5 12.5L9.5 7.5"
      stroke={color}
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </Svg>
);

export default ChevronIcon;
