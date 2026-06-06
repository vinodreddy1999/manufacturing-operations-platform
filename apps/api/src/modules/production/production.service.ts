import { Injectable } from "@nestjs/common";

@Injectable()
export class ProductionService {
  getSchedule() {
    return {
      workCenters: [
        { code: "WC-CUT-01", capacityHours: 16, loadHours: 12.5 },
        { code: "WC-ASM-02", capacityHours: 20, loadHours: 18.25 },
      ],
      orders: [
        {
          orderNo: "MO-2026-1042",
          item: "Hydraulic pump assembly",
          quantity: 240,
          status: "SCHEDULED",
          bomVersion: "BOM-HP-7",
        },
      ],
    };
  }
}
