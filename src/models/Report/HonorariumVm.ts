// Mirrors Dairy.Report.Api's HonorariumVmDto (GET /api/Report/GetDayWiseHonoList).
export interface HonorariumVm {
  bmcid?: number;
  bmcCode?: string;
  bmcName?: string;
  aDate?: string;
  invNo?: string;
  tanker?: string;
  comp?: string;
  fat?: number;
  snf?: number;
  ts?: number;
  litre?: number;
  mbrt?: number;
  rate?: number;
  qty?: number;
  amount?: number;
}
