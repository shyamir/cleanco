import React from "react";
import BookService from "./bookService";
import PaymentDue from "./paymentDue";
import UpcomingService from "./upcomingService";
import CleaningProgress from "./cleaningProgress";

type StatusCardProps = {
  hasService?: boolean;
  hasPaymentDue?: boolean;
  hasOngoingJob?: boolean; // 👈 new flag
  cleaningStatus?: "todo" | "in-progress" | "done"; // 👈 progress stages
};

export const StatusCard: React.FC<StatusCardProps> = ({
  hasService = false,
  hasPaymentDue = false,
  hasOngoingJob = false,
  cleaningStatus = "todo",
}) => {
  if (!hasService) {
    return <BookService />;
  }

  if (hasPaymentDue) {
    return <PaymentDue />;
  }

  if (hasOngoingJob) {
    return <CleaningProgress status={cleaningStatus} />;
  }

  return <UpcomingService />;
};
