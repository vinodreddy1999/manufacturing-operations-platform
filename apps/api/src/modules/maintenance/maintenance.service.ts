import { Injectable } from "@nestjs/common";

@Injectable()
export class MaintenanceService {
  listWorkOrders() {
    return [
      {
        id: "wo-9012",
        machine: "Press Line 3",
        type: "PREVENTIVE",
        priority: "HIGH",
        status: "OPEN",
        sparePartsReserved: true,
      },
    ];
  }
}
