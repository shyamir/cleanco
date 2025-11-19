import React from "react";
import Svg, { Path } from "react-native-svg";

interface IconProps {
  width?: number;
  height?: number;
  color?: string;
}

const BillIcon: React.FC<IconProps> = ({
  width = 24,
  height = 24,
  color = "#FDFDFD",
}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9.21429 11.1H14.7857M9.21429 14.7H14.7857M9.21429 7.5H14.7857M5.5 3.9C5.5 3.66131 5.59783 3.43239 5.77197 3.2636C5.94611 3.09482 6.1823 3 6.42857 3H17.5714C17.8177 3 18.0539 3.09482 18.228 3.2636C18.4022 3.43239 18.5 3.66131 18.5 3.9V21L15.25 18.75L12 21L8.75 18.75L5.5 21V3.9Z"
      stroke={color}
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </Svg>
);

export default BillIcon;
