# Cleaner Assignment Rules

## Business Rules for Auto-Assignment

### Number of Cleaners per Booking

| Bedrooms | Standard Assignment | Alternative (if advised) |
|----------|-------------------|--------------------------|
| 1 room   | 1 cleaner         | -                        |
| 2 rooms  | 1 cleaner         | -                        |
| 3 rooms  | 2 cleaners        | -                        |
| 4 rooms  | 2 cleaners        | 3 cleaners (if advised)  |

### Time Slot Duration
- Each time slot is **1 hour 45 minutes** (1:45 hrs)
- Cleaners can be assigned to consecutive slots without gaps

### Time Slots
1. 08:00 - 09:45
2. 09:45 - 11:30
3. 11:30 - 13:15
4. 14:00 - 15:45 (30-minute lunch break before this slot)
5. 15:45 - 17:30
6. 17:30 - 19:15
7. 19:15 - 21:00

### Implementation Notes
- Auto-assignment algorithm should consider:
  - Cleaner availability for the time slot
  - Workload balancing across cleaners
  - Cleaner location/proximity to booking address
  - Performance ratings
  - Required number of cleaners based on bedrooms

### Customer Display
- Only show **start time** to customers
- End time is internal for cleaner scheduling
- Example: Customer sees "08:00 AM", not "08:00 - 09:45"

## Future Implementation
This will be implemented in the **Cleaner Auto-Assignment Algorithm** module (Priority: HIGH).

Reference: See [PROGRESS.md](../PROGRESS.md) section 11.
