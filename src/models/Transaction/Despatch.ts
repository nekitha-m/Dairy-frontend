// Mirrors Dairy.Transaction.Api's DespatchMainDto / DespatchLineDto
// (GET /api/Despatch/GetDespatchMain, POST/PUT Insert|UpdateDespatch).
export interface DespatchLine {
  despatchLineId?: number;
  despatchMainId?: number;
  bmcId?: number;
  bmcCode?: string;
  bmcName?: string;
  advNo?: string;
  // Front readings
  fLitre?: number;
  fFat?: number;
  fSnf?: number;
  fLitFat?: number;
  fLitSnf?: number;
  // Measured/Middle readings (new feature)
  mLitre?: number;
  mFat?: number;
  mSnf?: number;
  mLitFat?: number;
  mLitSnf?: number;
  // Rear readings
  rLitre?: number;
  rFat?: number;
  rSnf?: number;
  rLitFat?: number;
  rLitSnf?: number;
  // Acknowledged Front values
  afLitre?: number;
  afFat?: number;
  afSnf?: number;
  afLitFat?: number;
  afLitSnf?: number;
  // Acknowledged Measured values
  amLitre?: number;
  amFat?: number;
  amSnf?: number;
  amLitFat?: number;
  amLitSnf?: number;
  // Acknowledged Rear values
  arLitre?: number;
  arFat?: number;
  arSnf?: number;
  arLitFat?: number;
  arLitSnf?: number;
  // Metadata
  modifiedDate?: string;
  modifiedUserId?: number;
  rowstatus?: boolean;
}

class Despatch {
  despatchMainId?: number;
  despatchDate?: string;
  invoiceNumber?: string;
  despatchToId?: number;
  tankerId?: number;
  tankerNumber?: string;
  driverName?: string;
  isAck?: boolean;
  fMbrt?: number;
  mMbrt?: number;
  rMbrt?: number;
  lines: DespatchLine[] = [];
}

export default Despatch;
