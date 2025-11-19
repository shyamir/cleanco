import React from "react";
import Svg, { Path } from "react-native-svg";

interface IconProps {
  width?: number;
  height?: number;
  color?: string;
}

const BroomIcon: React.FC<IconProps> = ({
  width = 24,
  height = 24,
  color = "#FDFDFD",
}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5.86642 19.1209C7.89392 21.0384 9.79892 21.2499 9.79892 21.2499C11.3879 19.8304 12.2539 18.5624 13.2199 15.8464C13.2199 15.8464 9.44592 12.1859 8.67442 11.0339C8.67442 11.0339 6.91992 11.9339 5.56292 12.0579C4.54042 12.1514 2.79492 11.6279 2.79492 11.6279C2.80892 13.0869 3.80642 17.1719 5.86642 19.1209Z"
      stroke={color}
      stroke-width="0.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <Path
      d="M8.67383 11.034C9.62533 10.496 11.3653 9.25696 12.1708 9.95896C12.8026 10.4734 13.3847 11.0461 13.9093 11.6695C14.4588 12.3865 13.7003 14.208 13.2193 15.8465"
      stroke={color}
      stroke-width="0.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <Path
      d="M13.0271 10.724C14.7106 9.214 21.2051 2.75 21.2051 2.75M3.51465 15.053C5.63315 15.2115 7.02965 14.747 7.02965 14.747M5.45865 18.6935C8.55365 18.26 9.62515 16.7085 9.62515 16.7085"
      stroke={color}
      stroke-width="0.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </Svg>
);

export default BroomIcon;
