import { Injectable } from "@nestjs/common";

@Injectable()
export class ProcurementService {
  listRequisitions() {
    return [
      {
        id: "pr-10041",
        item: "Cold rolled steel coil",
        quantity: 1800,
        status: "PENDING_APPROVAL",
        recommendedSupplier: "Apex Steel Components",
        approvalTemplate: "two-step-material-purchase",
      },
    ];
  }
}
