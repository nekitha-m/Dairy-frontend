// Mirrors Dairy.Report.Api's ConfiscatedMilkDto (GET /api/Report/GetConfiscatedMilkList).
export interface ConfiscatedMilk {
  bmcCode?: string;
  bmcName?: string;
  bmcId?: number;
  tankerId?: string;
  despatchDate?: string;
  invoiceNumber?: string;
  rate?: number;
  litre?: number;
  ts?: number;
  amount?: number;
  mbrt?: number;
}
