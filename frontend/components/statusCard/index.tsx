import React from "react";
import BookServiceCard from "./bookServiceCard";
import PaymentDueCard from "./paymentDueCard";
import UpcomingServiceCard from "./upcomingServiceCard";
import CleaningProgressCard from "./cleaningProgressCard";

type StatusCardProps = {
  hasService?: boolean;
  hasPaymentDue?: boolean;
  hasOngoingJob?: boolean;
  cleaningStatus?: "todo" | "in-progress" | "done"; // 👈 progress stages
};

export const StatusCard: React.FC<StatusCardProps> = ({
  hasService = false,
  hasPaymentDue = false,
  hasOngoingJob = false,
  cleaningStatus = "todo",
}) => {
  if (!hasService) {
    return <BookServiceCard />;
  }

  if (hasPaymentDue) {
    return <PaymentDueCard />;
  }

  if (hasOngoingJob) {
    return <CleaningProgressCard status={cleaningStatus} />;
  }

  return <UpcomingServiceCard serviceType={"home"} />;
};
