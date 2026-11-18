// Mirrors Dairy.Report.Api's DailyAckListDto (GET /api/Report/GetDailyAckList).
export interface DailyAckList {
  advNo?: string;
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
  fLitFat?: number;
  fLitSnf?: number;
  mLitFat?: number;
  mLitSnf?: number;
  rLitFat?: number;
  rLitSnf?: number;
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
}
