import { Injectable } from "@nestjs/common";

@Injectable()
export class ReportingService {
  listReports() {
    return [
      { key: "inventory-health", formats: ["PDF", "XLSX", "CSV"], scheduled: true },
      { key: "warehouse-utilization", formats: ["PDF", "CSV"], scheduled: false },
      { key: "approval-aging", formats: ["PDF", "XLSX"], scheduled: true },
    ];
  }
}
