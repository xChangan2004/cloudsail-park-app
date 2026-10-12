import gcoord from 'gcoord'

/** wgs84 -> gcj02 */
export const wgs84ToGcj02 = (lng: number, lat: number) => {
  const [longitude, latitude] = gcoord.transform([lng, lat], gcoord.WGS84, gcoord.GCJ02)
  return {longitude, latitude}
}