import { Injectable } from "@nestjs/common";

@Injectable()
export class ReservationService {
  calculateAvailableQuantity(input: {
    physicalQuantity: number;
    reservedQuantity: number;
    allocatedQuantity: number;
  }) {
    return (
      input.physicalQuantity -
      input.reservedQuantity -
      input.allocatedQuantity
    );
  }
}

