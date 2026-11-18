// Mirrors Dairy.Report.Api's CheckAckListDto (GET /api/Report/GetCheckAckList).
export interface CheckAckList {
  despatchDate?: string;
  bmcCode?: string;
  bmcName?: string;
  advNo?: string;
  tankerNo?: string;
  destinationId?: string;
  fLitre?: number;
  fFat?: number;
  fSnf?: number;
  mLitre?: number;
  mFat?: number;
  mSnf?: number;
  rLitre?: number;
  rFat?: number;
  rSnf?: number;
  afLitre?: number;
  amLitre?: number;
  arLitre?: number;
  invoiceNo?: string;
  gravity?: number;
  kg?: number;
  afFat?: number;
  afSnf?: number;
  amFat?: number;
  amSnf?: number;
  arFat?: number;
  arSnf?: number;
}
