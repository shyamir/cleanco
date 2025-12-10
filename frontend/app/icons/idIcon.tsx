import React from "react";
import Svg, { Text } from "react-native-svg";

interface IconProps {
  width?: number;
  height?: number;
  color?: string;
}

const IdIcon: React.FC<IconProps> = ({
  width = 24,
  height = 24,
  color = "#FDFDFD",
}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Text
      x="12"
      y="16"
      fontSize="12"
      fontWeight="bold"
      fill={color}
      textAnchor="middle"
    >
      ID
    </Text>
  </Svg>
);

export default IdIcon;
