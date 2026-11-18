// Mirrors Dairy.Report.Api's DesWiseTankerListDto (GET /api/Report/GetDesWiseTankerList).
export interface DesWiseTankerList {
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
  afLitSnf?: number;
  amLitFat?: number;
  amLitSnf?: number;
  arLitFat?: number;
  arLitSnf?: number;
  tankerNo?: string;
  invoiceNo?: string;
  kg?: number;
  gravity?: number;
}
