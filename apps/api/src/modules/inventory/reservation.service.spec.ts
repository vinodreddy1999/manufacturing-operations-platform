import { ReservationService } from "./reservation.service";

describe("ReservationService", () => {
  it("calculates available quantity from physical, reserved, and allocated stock", () => {
    const service = new ReservationService();

    expect(
      service.calculateAvailableQuantity({
        physicalQuantity: 100,
        reservedQuantity: 25,
        allocatedQuantity: 10,
      }),
    ).toBe(65);
  });
});

