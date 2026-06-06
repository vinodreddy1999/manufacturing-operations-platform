import { Injectable } from "@nestjs/common";

@Injectable()
export class AiService {
  listDraftActions() {
    return [
      {
        id: "ai-draft-447",
        recommendation: "Create purchase requisition for cold rolled steel coil",
        risk: "Stockout risk in 9 days",
        executionPolicy: "HUMAN_APPROVAL_REQUIRED",
      },
    ];
  }
}
