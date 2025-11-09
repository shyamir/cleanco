import React from "react";
import Svg, { Path } from "react-native-svg";

interface IconProps {
  width?: number;
  height?: number;
  color?: string;
}

const CardIcon: React.FC<IconProps> = ({
  width = 24,
  height = 24,
  color = "#FDFDFD",
}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 5H3C2.44772 5 2 5.44772 2 6V18C2 18.5523 2.44772 19 3 19H21C21.5523 19 22 18.5523 22 18V6C22 5.44772 21.5523 5 21 5Z"
      stroke={color}
      stroke-linejoin="round"
    />
    <Path
      d="M2 10H22M2 8.5V11.5M22 8.5V11.5M14.5 14.5H18.5"
      stroke={color}
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </Svg>
);

export default CardIcon;
