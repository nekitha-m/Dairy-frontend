class Tanker {
  tankerId?: number;
  tankerNumber?: string;
  transportName?: string;
  frontCapacity?: string;
  middleCapacity?:string;
  rearCapacity?: string;
  mobileNumber?: string;
  tankerTypeId?: number;
}
export default Tanker



export const TANKER_TYPES = [
  { value: 1, label: 'Contract' },
  { value: 2, label: 'Union' },
  { value: 3, label: 'Society' },
]