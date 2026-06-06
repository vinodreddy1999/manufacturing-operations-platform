import { Injectable } from "@nestjs/common";

@Injectable()
export class QualityService {
  listInspections() {
    return [
      {
        id: "insp-5521",
        item: "Hydraulic pump assembly",
        plan: "incoming-final-hp",
        status: "QUARANTINE_REVIEW",
        defects: 3,
        capaRequired: true,
      },
    ];
  }
}
