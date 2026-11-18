import type { DespatchLine } from './Despatch'

export interface AllocatedLine extends DespatchLine {
  afLitre?: number;
  afFat?: number;
  afSnf?: number;
  amLitre?: number;
  amFat?: number;
  amSnf?: number;
  arLitre?: number;
  arFat?: number;
  arSnf?: number;
}

class Acknowledgement {
  acknowledgementMainId?: number;
  despatchMainId?: number;
  despatchDate?: string;
  invoiceNumber?: string;
  despatchToId?: number;
  driverName?: string;
  lines: DespatchLine[] = [];
  acknowledgementDate?: string;
  acknowledgementEntryName?: string;
  kg?: number;
  gravity?: number;
  ackLitre?: number;
  temp?: number;
  fMbrt?: number;
  mMbrt?:number;
  rMbrt?: number;
  isAck?: boolean;
  isFSour?: boolean;
  isMSour?: boolean;
  isRSour?: boolean;
  afFat?: number;
  afSnf?: number;
  amFat?: number;
  amSnf?: number;
  arFat?: number;
  arSnf?: number;
  afLitre?: number;
  afLitFat?: number;
  afLitSnf?: number;
  amLitre?: number;
  amLitFat?: number;
  amLitSnf?: number;
  arLitre?: number;
  arLitFat?: number;
  arLitSnf?: number;
  allocatedLines?: AllocatedLine[]
}

export default Acknowledgement