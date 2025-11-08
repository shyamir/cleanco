import React from "react";
import Svg, { Path } from "react-native-svg";

interface IconProps {
  width?: number;
  height?: number;
  color?: string;
}

const SearchIcon: React.FC<IconProps> = ({
  width = 24,
  height = 24,
  color = "#FDFDFD",
}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9.38316 15.8571C12.9336 15.8571 15.8117 12.979 15.8117 9.42857C15.8117 5.87817 12.9336 3 9.38316 3C5.83276 3 2.95459 5.87817 2.95459 9.42857C2.95459 12.979 5.83276 15.8571 9.38316 15.8571Z"
      stroke={color}
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <Path
      d="M21.046 21.0001L13.8833 13.9287"
      stroke={color}
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </Svg>
);

export default SearchIcon;
