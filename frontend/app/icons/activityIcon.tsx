import React from "react";
import Svg, { Path } from "react-native-svg";

interface IconProps {
  width?: number;
  height?: number;
  color?: string;
}

const ActivityIcon: React.FC<IconProps> = ({
  width = 24,
  height = 24,
  color = "#FDFDFD",
}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9.71429 11.1H15.2857M9.71429 14.7H15.2857M9.71429 7.5H15.2857M6 3.9C6 3.66131 6.09783 3.43239 6.27197 3.2636C6.44611 3.09482 6.6823 3 6.92857 3H18.0714C18.3177 3 18.5539 3.09482 18.728 3.2636C18.9022 3.43239 19 3.66131 19 3.9V21L15.75 18.75L12.5 21L9.25 18.75L6 21V3.9Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default ActivityIcon;
