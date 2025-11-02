import React from "react";
import Svg, { Path } from "react-native-svg";

interface IconProps {
  width?: number;
  height?: number;
  color?: string;
}

const MinusIcon: React.FC<IconProps> = ({
  width = 24,
  height = 24,
  color = "#FDFDFD",
}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12H19H5Z" fill={color} />
    <Path
      d="M5 12H19"
      stroke={color}
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </Svg>
);

export default MinusIcon;
