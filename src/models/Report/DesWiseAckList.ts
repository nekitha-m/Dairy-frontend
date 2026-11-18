// Mirrors Dairy.Report.Api's DesWiseAckListDto (GET /api/Report/GetDesWiseAckList).
export interface DesWiseAckList {
  bmcCode?: string;
  bmcName?: string;
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
  afFat?: number;
  afSnf?: number;
  amLitre?: number;
  amFat?: number;
  amSnf?: number;
  arLitre?: number;
  arFat?: number;
  arSnf?: number;
  afLitFat?: number;
  afLitSnf?: number;
  amLitFat?: number;
  amLitSnf?: number;
  arLitFat?: number;
  arLitSnf?: number;
  fMbrt?: number;
  mMbrt?: number;
  rMbrt?: number;
}
