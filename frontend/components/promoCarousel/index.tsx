import React, { useState, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
} from "react-native";
import CouponCard from "../couponCard";
import { PromoCode } from "@/services/promoService";
import { useTheme } from "@/theme/ThemeProvider";

interface PromoCarouselProps {
  promos: PromoCode[];
  onApply: (promo: PromoCode) => void;
}

const PromoCarousel: React.FC<PromoCarouselProps> = ({ promos, onApply }) => {
  const { theme } = useTheme();
  const { width } = Dimensions.get("window");
  const cardWidth = width - 32; // Full width minus padding
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const getDiscountText = (promo: PromoCode): string => {
    if (promo.discountType === "PERCENTAGE") {
      return `Get ${promo.discountValue}% off!`;
    }
    return `Get ${promo.discountValue} MVR off!`;
  };

  const getServiceText = (promo: PromoCode): string => {
    if (
      promo.applicableServices.length === 0 ||
      promo.applicableServices.length === 2
    ) {
      return "All Cleaning Services";
    }
    return promo.applicableServices[0] === "HOME"
      ? "Home Cleaning Service"
      : "Office Cleaning Service";
  };

  const getVariant = (promo: PromoCode): "orange" | "blue" => {
    // Blue for office-only, orange for everything else
    return promo.applicableServices.length === 1 &&
      promo.applicableServices[0] === "OFFICE"
      ? "blue"
      : "orange";
  };

  const handleApply = (promo: PromoCode) => {
    onApply(promo);
    Alert.alert(
      "Promo Applied!",
      `Code "${promo.code}" has been saved. It will be applied at checkout.`,
      [{ text: "OK" }]
    );
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffset / cardWidth);
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < promos.length) {
      setActiveIndex(newIndex);
    }
  };

  if (promos.length === 0) return null;

  // Single promo - no carousel needed
  if (promos.length === 1) {
    const promo = promos[0];
    return (
      <CouponCard
        discountText={getDiscountText(promo)}
        serviceText={getServiceText(promo)}
        buttonText="Apply"
        variant={getVariant(promo)}
        onPress={() => handleApply(promo)}
      />
    );
  }

  // Multiple promos - show carousel
  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        snapToInterval={cardWidth + 8}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {promos.map((promo, index) => (
          <View
            key={promo.id}
            style={[
              styles.cardWrapper,
              { width: cardWidth },
              index < promos.length - 1 && { marginRight: 8 },
            ]}
          >
            <CouponCard
              discountText={getDiscountText(promo)}
              serviceText={getServiceText(promo)}
              buttonText="Apply"
              variant={getVariant(promo)}
              onPress={() => handleApply(promo)}
            />
          </View>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {promos.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  index === activeIndex
                    ? theme.colors.system.body.default
                    : theme.colors.system.body.disabled,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  scrollContent: {
    paddingRight: 0,
  },
  cardWrapper: {
    flexShrink: 0,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default PromoCarousel;
