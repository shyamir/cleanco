import React from "react";
import BookServiceCard from "./bookServiceCard";
import PaymentDueCard from "./paymentDueCard";
import UpcomingServiceCard from "./upcomingServiceCard";
import CleaningProgressCard from "./cleaningProgressCard";
import { UpcomingBooking } from "@/services/bookingService";

type StatusCardProps = {
  upcomingBooking?: UpcomingBooking | null;
  hasPaymentDue?: boolean;
  hasOngoingJob?: boolean;
  cleaningStatus?: "todo" | "in-progress" | "done";
};

export const StatusCard: React.FC<StatusCardProps> = ({
  upcomingBooking,
  hasPaymentDue = false,
  hasOngoingJob = false,
  cleaningStatus = "todo",
}) => {
  if (!upcomingBooking) {
    return <BookServiceCard />;
  }

  if (hasPaymentDue) {
    return <PaymentDueCard />;
  }

  if (hasOngoingJob) {
    return <CleaningProgressCard status={cleaningStatus} />;
  }

  const serviceType = upcomingBooking.serviceType === "HOME" ? "home" : "office";

  // Show label and address (e.g., "Home - H11, 3rd Floor")
  const { label, address } = upcomingBooking.address;
  const displayAddress = label ? `${label} - ${address}` : address;

  return (
    <UpcomingServiceCard
      serviceType={serviceType}
      date={upcomingBooking.date}
      time={upcomingBooking.timeSlot.displayStartTime}
      address={displayAddress}
    />
  );
};
