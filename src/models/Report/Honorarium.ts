// Mirrors Dairy.Report.Api's HonorariumDto (GET /api/Report/GetHonorariumList).
export interface Honorarium {
  bmcCode?: string;
  bmcName?: string;
  bmcId?: number;
  typ?: string;
  description?: string;
  tsMin?: number;
  tsMax?: number;
  rate?: number;
  litre?: number;
  ts?: number;
  amount?: number;
  mbrt?: number;
}
