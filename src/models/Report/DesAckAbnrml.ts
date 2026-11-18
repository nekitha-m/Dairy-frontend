// Mirrors Dairy.Report.Api's DesAckAbnrmlDto (GET /api/Report/GetDesAckAbnrmlList).
export interface DesAckAbnrml {
  despatchDate?: string;
  invoiceNo?: string;
  destinationId?: string;
  tankerNo?: string;
  bmcName?: string;
  fLitre?: number;
  mLitre?: number;
  rLitre?: number;
  afLitre?: number;
  amLitre?: number;
  arLitre?: number;
}
