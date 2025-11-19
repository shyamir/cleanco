import React from "react";
import Svg, { Path } from "react-native-svg";

interface IconProps {
  width?: number;
  height?: number;
  color?: string;
}

const HelpIcon: React.FC<IconProps> = ({ width = 24, height = 24, color }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
      stroke={color}
    />
    <Path
      d="M12 18.5C12.2761 18.5 12.5 18.2761 12.5 18C12.5 17.7239 12.2761 17.5 12 17.5C11.7239 17.5 11.5 17.7239 11.5 18C11.5 18.2761 11.7239 18.5 12 18.5Z"
      fill={color}
    />
    <Path
      d="M12 16V15.143C12 14.429 12.357 13.762 12.951 13.366L13.55 12.966C13.9959 12.6683 14.3615 12.2653 14.6144 11.7926C14.8673 11.3199 14.9998 10.7921 15 10.256V10C15 9.20435 14.6839 8.44129 14.1213 7.87868C13.5587 7.31607 12.7956 7 12 7C11.2044 7 10.4413 7.31607 9.87868 7.87868C9.31607 8.44129 9 9.20435 9 10"
      stroke={color}
    />
  </Svg>
);

export default HelpIcon;
