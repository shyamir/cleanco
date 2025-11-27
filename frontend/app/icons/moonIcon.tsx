import React from "react";
import Svg, { Path } from "react-native-svg";

interface IconProps {
  width?: number;
  height?: number;
  color?: string;
}

const MoonIcon: React.FC<IconProps> = ({
  width = 24,
  height = 24,
  color = "#FDFDFD",
}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9.78514 3C8.23282 3.41617 6.81739 4.2336 5.6811 5.37014C4.5448 6.50667 3.72767 7.92227 3.31182 9.47467C2.89597 11.0271 2.89606 12.6616 3.31207 14.2139C3.72808 15.7663 4.54536 17.1818 5.68178 18.3182C6.81819 19.4546 8.2337 20.2719 9.78606 20.6879C11.3384 21.1039 12.9729 21.104 14.5253 20.6882C16.0777 20.2723 17.4933 19.4552 18.6299 18.3189C19.7664 17.1826 20.5838 15.7672 21 14.2149C21 14.2149 16.3172 16.0068 12.1548 11.8444C7.994 7.68282 9.78595 3 9.78595 3"
      stroke={color}
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </Svg>
);

export default MoonIcon;
