// Mirrors Dairy.Report.Api's HonorariumListOldDto (GET /api/Report/GetHonoListOld).
export interface HonorariumListOld {
  bmcCode?: string;
  bmcName?: string;
  bmcId?: number;
  typ?: string;
  description?: string;
  tsMin?: number;
  tsMax?: number;
  rate?: number;
  litre?: number;
  amount?: number;
}
