import React from "react";
import Svg, { Path } from "react-native-svg";

interface IconProps {
  width?: number;
  height?: number;
  color?: string;
}

const LocationIcon: React.FC<IconProps> = ({
  width = 24,
  height = 24,
  color = "#FDFDFD",
}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12.5598 20.82C12.3966 20.9372 12.2007 21.0003 11.9998 21.0003C11.7988 21.0003 11.603 20.9372 11.4398 20.82C6.61078 17.378 1.48578 10.298 6.66678 5.182C8.08912 3.78285 10.0046 2.99912 11.9998 3C13.9998 3 15.9188 3.785 17.3328 5.181C22.5138 10.297 17.3888 17.376 12.5598 20.82Z"
      stroke={color}
      stroke-width="1.2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <Path
      d="M12 12C12.5304 12 13.0391 11.7893 13.4142 11.4142C13.7893 11.0391 14 10.5304 14 10C14 9.46957 13.7893 8.96086 13.4142 8.58579C13.0391 8.21071 12.5304 8 12 8C11.4696 8 10.9609 8.21071 10.5858 8.58579C10.2107 8.96086 10 9.46957 10 10C10 10.5304 10.2107 11.0391 10.5858 11.4142C10.9609 11.7893 11.4696 12 12 12Z"
      stroke={color}
      stroke-width="1.2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </Svg>
);

export default LocationIcon;
