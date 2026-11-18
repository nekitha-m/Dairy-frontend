// Mirrors Dairy.Report.Api's BmcWiseAckAbsDto (GET /api/Report/GetBmcWiseAckAbsList).
export interface BmcWiseAckAbs {
  bmcCode?: string;
  bmcName?: string;
  afLitre?: number;
  afFat?: number;
  afSnf?: number;
   amLitre?: number;
  amFat?: number;
  amSnf?: number;
  arLitre?: number;
  arFat?: number;
  arSnf?: number;
  afLitFat?: number;
  amLitFat?: number;
  arLitFat?: number;
  afLitSnf?: number;
   amLitSnf?: number;
  arLitSnf?: number;
}
