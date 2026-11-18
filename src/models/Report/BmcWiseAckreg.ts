// Mirrors Dairy.Report.Api's BmcWiseAckregDto (GET /api/Report/GetBmcWiseAckreg).
export interface BmcWiseAckreg {
  bmcCode?: string;
  bmcName?: string;
  advNo?: string;
  fLitre?: number;
  mLitre?: number;
  rLitre?: number;
  afLitre?: number;
  amLitre?: number;
  arLitre?: number;
}
