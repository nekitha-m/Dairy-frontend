import type { DespatchLine } from './Despatch';
import type { AllocatedLine } from './Acknowledgement';


class DesAndAck {
  despatchMainId?: number;
  despatchDate?: string;
  invoiceNumber?: string;
  despatchToId?: number;
  tankerId?: number;
  tankerNumber?: string;
  driverName?: string;
  lines: DespatchLine[] = [];
  acknowledgementMainId?: number;
  acknowledgementDate?: string;
  acknowledgementEntryName?: string;
  kg?: number;
  gravity?: number;
  temp?: number;
  afFat?: number;
  afSnf?: number;
  amFat?: number;
  amSnf?: number;
  arFat?: number;
  arSnf?: number;
  fMbrt?: number;
  mMbrt?: number;
  rMbrt?: number;
  ackLitre?: number;
  isFSour?: boolean;
  isMSour?: boolean;
  isRSour?: boolean;
  afLitre?: number;
  afLitFat?: number;
  afLitSnf?: number;
   amLitre?: number;
  amLitFat?: number;
  amLitSnf?: number;
  arLitre?: number;
  arLitFat?: number;
  arLitSnf?: number;
  allocatedLines?: AllocatedLine[];
}

export default DesAndAck;
