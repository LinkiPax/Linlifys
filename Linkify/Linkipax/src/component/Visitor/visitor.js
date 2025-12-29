import axios from "axios";
import { getDeviceId } from "../../utils/deviceId";

export async function registerVisit() {
  const deviceId = getDeviceId();

  const res = await axios.post(`${import.meta.env.VITE_API_URL}/visitor/visit`, {
    deviceId
  });

  return res.data; 
  // { isNew, totalVisitors }
}
